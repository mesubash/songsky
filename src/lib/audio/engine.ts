import { EQ_BANDS } from './eq';

/**
 * Audio graph:
 *
 *   <audio> A ─► gain A ─┐
 *                        ├─► EQ (5 filters) ─► master ─► analyser ─► speakers
 *   <audio> B ─► gain B ─┘
 *
 * One deck is "active": its events drive the player. A crossfade loads the next song on
 * the idle deck, ramps the gains in opposite directions, then swaps which deck is active.
 *
 * The AudioContext is created on the first play() so it starts inside a user gesture,
 * which iOS and Chrome require.
 *
 * With `effects: false` the graph is never built and the <audio> elements play straight
 * to the speakers. iOS needs this: it suspends Web Audio when the screen locks, which
 * silences anything routed through it, while plain media elements keep playing.
 */

export interface EngineEvents {
  timeupdate(time: number): void;
  durationchange(duration: number): void;
  ended(): void;
  playing(playing: boolean): void;
  error(): void;
}

interface Deck {
  audio: HTMLAudioElement;
  url: string | null;
  gain: GainNode | null;
}

export class AudioEngine {
  #decks: [Deck, Deck];
  #active = 0;
  #events: EngineEvents;

  #context: AudioContext | null = null;
  #master: GainNode | null = null;
  #filters: BiquadFilterNode[] = [];
  #analyser: AnalyserNode | null = null;

  #volume = 1;
  #muted = false;
  #eq: number[] = EQ_BANDS.map(() => 0);
  #fadeTimer: ReturnType<typeof setTimeout> | undefined;

  /** Whether EQ, crossfade and the analyser are available. */
  readonly effects: boolean;

  constructor(events: EngineEvents, { effects = true }: { effects?: boolean } = {}) {
    this.#events = events;
    this.effects = effects && typeof AudioContext !== 'undefined';
    this.#decks = [this.#createDeck(0), this.#createDeck(1)];
  }

  get analyser(): AnalyserNode | null {
    return this.#analyser;
  }

  get currentTime(): number {
    return this.#deck.audio.currentTime;
  }

  get duration(): number {
    const { duration } = this.#deck.audio;
    return Number.isFinite(duration) ? duration : 0;
  }

  get paused(): boolean {
    return this.#deck.audio.paused;
  }

  get fading(): boolean {
    return this.#fadeTimer !== undefined;
  }

  /** Loads a song on the active deck, cutting off anything still fading out. */
  load(file: Blob | string, startAt = 0): void {
    this.#finishFade();
    this.#stop(this.#idle);
    this.#setSource(this.#deck, file, startAt);
    this.#setGain(this.#deck, 1);
  }

  async play(): Promise<void> {
    this.#ensureGraph();
    if (this.#context?.state === 'suspended') await this.#context.resume();
    await this.#deck.audio.play();
  }

  pause(): void {
    this.#finishFade();
    this.#deck.audio.pause();
  }

  seek(time: number): void {
    this.#deck.audio.currentTime = time;
  }

  /** Starts `file` on the idle deck and fades between the two over `seconds`. */
  async crossfadeTo(file: Blob | string, seconds: number): Promise<void> {
    this.#finishFade();
    const outgoing = this.#deck;
    this.#active = 1 - this.#active;
    const incoming = this.#deck;

    this.#setSource(incoming, file, 0);
    this.#ensureGraph();
    const context = this.#context;
    if (!context || !outgoing.gain || !incoming.gain) {
      // No Web Audio: fall back to a straight cut.
      this.#stop(outgoing);
      await incoming.audio.play();
      return;
    }

    const now = context.currentTime;
    incoming.gain.gain.cancelScheduledValues(now);
    incoming.gain.gain.setValueAtTime(0, now);
    incoming.gain.gain.linearRampToValueAtTime(1, now + seconds);
    outgoing.gain.gain.cancelScheduledValues(now);
    outgoing.gain.gain.setValueAtTime(outgoing.gain.gain.value, now);
    outgoing.gain.gain.linearRampToValueAtTime(0, now + seconds);

    this.#fadeTimer = setTimeout(() => this.#finishFade(), seconds * 1000);
    await incoming.audio.play();
  }

  setVolume(volume: number, muted: boolean): void {
    this.#volume = volume;
    this.#muted = muted;
    this.#applyVolume();
  }

  setEq(gains: readonly number[]): void {
    this.#eq = [...gains];
    this.#filters.forEach((filter, i) => {
      filter.gain.value = this.#eq[i] ?? 0;
    });
  }

  get #deck(): Deck {
    return this.#decks[this.#active] as Deck;
  }

  get #idle(): Deck {
    return this.#decks[1 - this.#active] as Deck;
  }

  #createDeck(index: number): Deck {
    const audio = new Audio();
    audio.preload = 'auto';
    // Streams come from other sites; without this, Web Audio would play them as silence.
    audio.crossOrigin = 'anonymous';
    const deck: Deck = { audio, url: null, gain: null };
    const isActive = () => this.#active === index;

    audio.addEventListener(
      'timeupdate',
      () => isActive() && this.#events.timeupdate(audio.currentTime),
    );
    audio.addEventListener('durationchange', () => {
      if (isActive() && Number.isFinite(audio.duration))
        this.#events.durationchange(audio.duration);
    });
    audio.addEventListener('ended', () => isActive() && this.#events.ended());
    audio.addEventListener('play', () => isActive() && this.#events.playing(true));
    audio.addEventListener('pause', () => isActive() && this.#events.playing(false));
    audio.addEventListener('error', () => isActive() && audio.src && this.#events.error());
    return deck;
  }

  /** A Blob plays through a temporary object URL; a string is a stream address. */
  #setSource(deck: Deck, file: Blob | string, startAt: number): void {
    if (deck.url) URL.revokeObjectURL(deck.url);
    deck.url = typeof file === 'string' ? null : URL.createObjectURL(file);
    deck.audio.src = deck.url ?? (file as string);
    if (startAt > 0) deck.audio.currentTime = startAt;
  }

  #stop(deck: Deck): void {
    deck.audio.pause();
    if (deck.audio.getAttribute('src')) {
      // Also closes stream connections, not just object URLs.
      deck.audio.removeAttribute('src');
      deck.audio.load();
    }
    if (deck.url) {
      URL.revokeObjectURL(deck.url);
      deck.url = null;
    }
  }

  #finishFade(): void {
    if (this.#fadeTimer === undefined) return;
    clearTimeout(this.#fadeTimer);
    this.#fadeTimer = undefined;
    this.#stop(this.#idle);
    this.#setGain(this.#deck, 1);
  }

  #setGain(deck: Deck, value: number): void {
    if (!deck.gain || !this.#context) return;
    deck.gain.gain.cancelScheduledValues(this.#context.currentTime);
    deck.gain.gain.value = value;
  }

  #applyVolume(): void {
    const level = this.#muted ? 0 : this.#volume;
    if (this.#master) {
      this.#master.gain.value = level;
    } else {
      // Before the graph exists, volume lives on the elements themselves.
      for (const deck of this.#decks) deck.audio.volume = level;
    }
  }

  #ensureGraph(): void {
    if (this.#context || !this.effects) return;
    const context = new AudioContext({ latencyHint: 'playback' });

    this.#filters = EQ_BANDS.map((band, i) => {
      const filter = context.createBiquadFilter();
      filter.type = band.type;
      filter.frequency.value = band.frequency;
      filter.gain.value = this.#eq[i] ?? 0;
      return filter;
    });
    this.#master = context.createGain();
    this.#analyser = context.createAnalyser();
    this.#analyser.fftSize = 2048;
    this.#analyser.smoothingTimeConstant = 0.8;

    const chain = [...this.#filters, this.#master, this.#analyser, context.destination];
    for (let i = 0; i < chain.length - 1; i++) chain[i]?.connect(chain[i + 1] as AudioNode);

    const eqInput = this.#filters[0] as BiquadFilterNode;
    for (const deck of this.#decks) {
      deck.audio.volume = 1; // Volume is now applied by the master gain.
      deck.gain = context.createGain();
      deck.gain.gain.value = deck === this.#deck ? 1 : 0;
      context.createMediaElementSource(deck.audio).connect(deck.gain).connect(eqInput);
    }

    this.#context = context;
    this.#applyVolume();
  }
}
