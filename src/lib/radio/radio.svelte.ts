import { player } from '$lib/player/player.svelte';
import type { Station } from './stations';

/**
 * Live radio. It has its own plain <audio> element because most stations don't allow
 * their audio to be routed through Web Audio (the EQ and crossfade), which would make
 * them silent. Radio and songs never play at once: starting one pauses the other.
 */
class Radio {
  station = $state<Station | null>(null);
  playing = $state(false);
  loading = $state(false);
  error = $state<string | null>(null);
  #audio: HTMLAudioElement | null = null;

  constructor() {
    // A song starting stops the radio.
    $effect.root(() => {
      $effect(() => {
        if (player.playing) this.stop();
      });
    });
  }

  async play(station: Station): Promise<void> {
    const audio = this.#element();
    if (this.station?.id !== station.id) {
      this.station = station;
      audio.src = station.streamUrl;
    }
    this.error = null;
    this.loading = true;
    player.pause();
    this.#updateMediaSession();
    try {
      await audio.play();
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        this.error = 'This station isn’t broadcasting right now. Try another one.';
      }
      this.loading = false;
    }
  }

  toggle(): void {
    if (!this.station) return;
    if (this.playing) this.pause();
    else void this.play(this.station);
  }

  pause(): void {
    this.#audio?.pause();
  }

  /** Stops and hides the radio bar. */
  stop(): void {
    if (this.#audio) {
      this.#audio.pause();
      this.#audio.removeAttribute('src');
      this.#audio.load();
    }
    this.station = null;
    this.playing = false;
    this.loading = false;
  }

  setVolume(volume: number): void {
    if (this.#audio) this.#audio.volume = volume;
  }

  #element(): HTMLAudioElement {
    if (this.#audio) return this.#audio;
    const audio = new Audio();
    audio.preload = 'none';
    audio.addEventListener('playing', () => {
      this.playing = true;
      this.loading = false;
    });
    audio.addEventListener('pause', () => {
      this.playing = false;
    });
    audio.addEventListener('waiting', () => {
      this.loading = true;
    });
    audio.addEventListener('error', () => {
      if (!audio.getAttribute('src')) return;
      this.playing = false;
      this.loading = false;
      this.error = 'This station isn’t broadcasting right now. Try another one.';
    });
    this.#audio = audio;
    return audio;
  }

  #updateMediaSession(): void {
    if (!('mediaSession' in navigator) || !this.station) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: this.station.name,
      artist: 'Live radio',
      album: this.station.country,
      artwork: this.station.logo ? [{ src: this.station.logo }] : [],
    });
    navigator.mediaSession.setActionHandler('play', () => this.toggle());
    navigator.mediaSession.setActionHandler('pause', () => this.pause());
  }
}

export const radio = new Radio();
