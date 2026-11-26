import { AudioEngine } from '$lib/audio/engine';
import { fadeLength } from '$lib/audio/eq';
import { sound } from '$lib/audio/sound.svelte';
import { library } from '$lib/library/library.svelte';
import type { Track } from '$lib/library/types';
import { memory } from '$lib/memory/memory.svelte';
import { isIOS } from '$lib/platform';
import {
  moveToNext,
  nextIndex,
  prevIndex,
  REPEAT_ORDER,
  type RepeatMode,
  shuffledWithFirst,
} from './queue';

const STORAGE_KEY = 'songsky:player';
/** Pressing previous after this many seconds restarts the song instead. */
const RESTART_AFTER = 3;

interface SavedSession {
  order: string[];
  queue: string[];
  index: number;
  position: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
}

class Player {
  queue = $state<string[]>([]);
  index = $state(-1);
  shuffle = $state(false);
  repeat = $state<RepeatMode>('off');
  playing = $state(false);
  position = $state(0);
  duration = $state(0);
  volume = $state(1);
  muted = $state(false);
  error = $state<string | null>(null);
  /** When set, playback stops as soon as the current song ends (sleep timer). */
  stopAfterCurrent = $state(false);

  current: Track | null = $derived(library.byId.get(this.queue[this.index] ?? '') ?? null);

  /** Queue order before shuffling, so turning shuffle off restores it. */
  #order: string[] = [];
  #loadedId: string | null = null;
  #loadToken = 0;
  /** Temporary volume multiplier (sleep fade). Not saved as the person's volume. */
  #fade = 1;
  /** The next song's file, fetched ahead of time. See #prepareNext. */
  #upNext: { id: string; file: File } | null = null;
  #fadeStarting = false;
  #engine = new AudioEngine(
    {
      playing: (playing) => {
        if (playing) this.error = null;
        this.#setPlaying(playing);
      },
      ended: () => void this.next(true),
      timeupdate: (time) => {
        this.position = time;
        this.#syncPositionState();
        this.#maybeCrossfade(time);
      },
      durationchange: (duration) => {
        this.duration = duration;
        if (this.#loadedId) void library.setDuration(this.#loadedId, duration);
      },
      error: () => {
        this.error =
          'This song could not be played. The file may be damaged or in an unsupported format.';
      },
    },
    { effects: !isIOS() },
  );

  constructor() {
    $effect.root(() => {
      $effect(() => this.#engine.setEq(sound.eq));
    });

    this.#bindMediaSession();
    addEventListener('pagehide', () => this.save());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.save();
    });
  }

  /** Replaces the queue with `ids` and starts playing `ids[start]`. */
  async playList(ids: string[], start = 0): Promise<void> {
    this.#order = [...ids];
    if (this.shuffle) {
      this.queue = shuffledWithFirst(ids, ids[start]);
      this.index = 0;
    } else {
      this.queue = [...ids];
      this.index = start;
    }
    await this.#load(true);
  }

  /** Plays songs in a fixed order (a mix), so shuffle is turned off. */
  async playInOrder(ids: string[]): Promise<void> {
    this.shuffle = false;
    await this.playList(ids, 0);
  }

  async shuffleAll(ids: string[]): Promise<void> {
    this.shuffle = true;
    await this.playList(ids, Math.floor(Math.random() * ids.length));
  }

  async toggle(): Promise<void> {
    if (this.playing) return this.pause();
    if (!this.current) {
      if (library.tracks.length) await this.playList(library.tracks.map((t) => t.id));
      return;
    }
    if (this.#loadedId !== this.current.id) return this.#load(true, this.position);
    await this.#play();
  }

  pause(): void {
    this.#engine.pause();
  }

  /** False on iPhone and iPad, where EQ, crossfade and the visualizer are turned off. */
  get effectsAvailable(): boolean {
    return this.#engine.effects;
  }

  /** Frequency data for visualizers. Null until the first song plays. */
  get analyser(): AnalyserNode | null {
    return this.#engine.analyser;
  }

  /** `auto` means the song ended by itself (repeat-one replays, end of queue stops). */
  async next(auto = false): Promise<void> {
    if (auto && this.stopAfterCurrent) {
      this.stopAfterCurrent = false;
      this.setFade(1);
      return;
    }
    const index = nextIndex(this.queue.length, this.index, this.repeat, auto);
    if (index === null) {
      // End of the queue: rewind to the first song and stop.
      this.index = 0;
      await this.#load(false);
      return;
    }
    if (index === this.index) {
      this.seek(0);
      await this.#play();
      return;
    }
    this.index = index;
    await this.#load(true);
  }

  async prev(): Promise<void> {
    const index = prevIndex(this.queue.length, this.index, this.repeat);
    if (this.position > RESTART_AFTER || index === null) {
      this.seek(0);
      return;
    }
    this.index = index;
    await this.#load(this.playing);
  }

  seek(seconds: number): void {
    const max = this.duration || seconds;
    const time = Math.min(Math.max(seconds, 0), max);
    this.position = time;
    if (this.#loadedId) this.#engine.seek(time);
  }

  setVolume(volume: number): void {
    this.volume = Math.min(Math.max(volume, 0), 1);
    this.muted = this.volume === 0;
    this.#applyVolume();
  }

  setFade(factor: number): void {
    this.#fade = Math.min(Math.max(factor, 0), 1);
    this.#applyVolume();
  }

  toggleMute(): void {
    this.muted = !this.muted;
    if (!this.muted && this.volume === 0) this.volume = 0.5;
    this.#applyVolume();
  }

  /** Moves a song in the queue (or adds it) so it plays right after the current one. */
  playNextUp(id: string): void {
    if (this.queue[this.index + 1] === id) return;
    ({ queue: this.queue, index: this.index } = moveToNext(this.queue, this.index, id));
    void this.#prepareNext();
  }

  toggleShuffle(): void {
    const currentId = this.queue[this.index];
    this.shuffle = !this.shuffle;
    if (currentId === undefined) return;
    if (this.shuffle) {
      this.queue = shuffledWithFirst(this.#order, currentId);
      this.index = 0;
    } else {
      this.queue = [...this.#order];
      this.index = this.#order.indexOf(currentId);
    }
    void this.#prepareNext();
  }

  cycleRepeat(): void {
    const i = REPEAT_ORDER.indexOf(this.repeat);
    this.repeat = REPEAT_ORDER[(i + 1) % REPEAT_ORDER.length] ?? 'off';
    void this.#prepareNext();
  }

  save(): void {
    const session: SavedSession = {
      order: this.#order,
      queue: this.queue,
      index: this.index,
      position: this.position,
      volume: this.volume,
      muted: this.muted,
      shuffle: this.shuffle,
      repeat: this.repeat,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Private mode or full storage: the session just isn't remembered.
    }
  }

  /** Restores the last queue and position without playing (browsers need a tap first). */
  restore(): void {
    let session: SavedSession;
    try {
      session = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    } catch {
      return;
    }
    if (!session) return;

    const known = (ids: string[]) => ids.filter((id) => library.byId.has(id));
    const currentId = session.queue[session.index];
    this.#order = known(session.order);
    this.queue = known(session.queue);
    this.index = currentId ? this.queue.indexOf(currentId) : -1;
    this.position = this.index >= 0 ? session.position : 0;
    this.duration = this.current?.duration ?? 0;
    this.volume = session.volume;
    this.muted = session.muted;
    this.shuffle = session.shuffle;
    this.repeat = session.repeat;
    this.#applyVolume();
    this.#updateMetadata();
  }

  /**
   * Loads the current track. With `fadeWithin` (seconds left on the outgoing song) it
   * crossfades into it instead of cutting.
   */
  async #load(autoplay: boolean, startAt = 0, fadeWithin?: number): Promise<void> {
    const token = ++this.#loadToken;
    const track = this.current;
    if (!track) return;

    this.error = null;
    this.position = startAt;
    this.duration = track.duration;
    this.#updateMetadata();

    // When the file is already fetched, nothing here waits: iOS stops running a locked
    // page moments after a song ends, so the next one must start straight away.
    const ready = this.#upNext?.id === track.id ? this.#upNext.file : null;
    const file = ready ?? (await library.fileFor(track));
    if (token !== this.#loadToken) return; // A newer load started meanwhile.
    if (!file) {
      this.#engine.pause();
      this.error = `“${track.title}” isn't available. Add it again to play it.`;
      return;
    }

    this.#loadedId = track.id;
    if (fadeWithin !== undefined) {
      try {
        await this.#engine.crossfadeTo(
          file,
          fadeLength(sound.crossfade, fadeWithin, track.duration),
        );
        void memory.record(track.id);
      } catch {
        this.error = 'Playback was blocked. Press play to start.';
      }
      void this.#prepareNext();
      return;
    }

    this.#engine.load(file, startAt);
    void this.#prepareNext();
    if (autoplay) await this.#play();
  }

  /** Fetches the song that will play after this one, so it can start without waiting. */
  async #prepareNext(): Promise<void> {
    const index = nextIndex(this.queue.length, this.index, this.repeat, true);
    const id = index === null ? undefined : this.queue[index];
    const track = id === undefined ? undefined : library.byId.get(id);
    if (!track || this.#upNext?.id === track.id) return;
    const file = await library.fileFor(track);
    this.#upNext = file ? { id: track.id, file } : null;
  }

  /** Starts the next song early so the two overlap, when crossfade is on. */
  #maybeCrossfade(time: number): void {
    const { duration } = this.#engine;
    const remaining = duration - time;
    if (
      !this.#engine.effects ||
      this.stopAfterCurrent ||
      sound.crossfade === 0 ||
      this.repeat === 'one' ||
      this.#fadeStarting ||
      this.#engine.fading ||
      duration <= 0 ||
      remaining > sound.crossfade
    ) {
      return;
    }
    const index = nextIndex(this.queue.length, this.index, this.repeat, true);
    if (index === null || index === this.index) return;

    this.#fadeStarting = true;
    this.index = index;
    void this.#load(true, 0, remaining).finally(() => {
      this.#fadeStarting = false;
    });
  }

  async #play(): Promise<void> {
    try {
      await this.#engine.play();
      if (this.#loadedId && this.position < 1) void memory.record(this.#loadedId);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        this.error = 'Playback was blocked. Press play to start.';
      }
    }
  }

  #setPlaying(playing: boolean): void {
    this.playing = playing;
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
      // iOS can drop handlers registered before audio started, then shows its own
      // ±10 s buttons. Registering again on every start keeps next/previous there.
      if (playing) this.#bindMediaSession();
    }
    if (!playing) this.save();
  }

  #applyVolume(): void {
    this.#engine.setVolume(this.volume * this.#fade, this.muted);
  }

  #bindMediaSession(): void {
    if (!('mediaSession' in navigator)) return;
    const handlers: [MediaSessionAction, MediaSessionActionHandler | null][] = [
      ['play', () => void this.toggle()],
      ['pause', () => this.pause()],
      ['previoustrack', () => void this.prev()],
      ['nexttrack', () => void this.next()],
      ['seekto', (d) => d.seekTime !== undefined && this.seek(d.seekTime)],
      // Cleared on purpose: when these exist, iOS shows them instead of next/previous.
      ['seekbackward', null],
      ['seekforward', null],
    ];
    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Browser doesn't support this action.
      }
    }
  }

  #updateMetadata(): void {
    const track = this.current;
    if (!('mediaSession' in navigator) || !track) return;
    const base = { title: track.title, artist: track.artist, album: track.album };
    navigator.mediaSession.metadata = new MediaMetadata(base);
    if (!track.coverId) return;
    void library.coverUrl(track.coverId).then((src) => {
      if (src && this.current?.id === track.id) {
        navigator.mediaSession.metadata = new MediaMetadata({ ...base, artwork: [{ src }] });
      }
    });
  }

  #syncPositionState(): void {
    const { duration, currentTime } = this.#engine;
    if (!('mediaSession' in navigator) || duration <= 0 || currentTime > duration) {
      return;
    }
    navigator.mediaSession.setPositionState({ duration, position: currentTime });
  }
}

export const player = new Player();
