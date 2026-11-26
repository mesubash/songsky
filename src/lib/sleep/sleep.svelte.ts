import { player } from '$lib/player/player.svelte';
import { fadeFactor } from './fade';

const TICK_MS = 1000;

/**
 * Sleep timer. When time runs out, the current song is allowed to finish (fading out
 * over its last seconds) and then playback stops, so nothing is cut off mid-song.
 */
class Sleep {
  /** When the timer runs out, or null when no timer is set. */
  endsAt = $state<number | null>(null);
  /** True while the last song plays out. */
  finishing = $state(false);
  now = $state(Date.now());

  #timer: ReturnType<typeof setInterval> | undefined;

  get active(): boolean {
    return this.endsAt !== null || this.finishing;
  }

  setMinutes(minutes: number): void {
    this.#reset();
    this.endsAt = Date.now() + minutes * 60_000;
    this.#start();
  }

  endOfSong(): void {
    this.#reset();
    this.#finish();
    this.#start();
  }

  cancel(): void {
    this.#reset();
  }

  #start(): void {
    this.#timer = setInterval(() => this.#tick(), TICK_MS);
    this.#tick();
  }

  #finish(): void {
    this.endsAt = null;
    this.finishing = true;
    player.stopAfterCurrent = true;
  }

  #tick(): void {
    this.now = Date.now();
    if (this.endsAt !== null && this.now >= this.endsAt) this.#finish();
    if (!this.finishing) return;
    if (!player.stopAfterCurrent) {
      // The last song ended and the player stopped.
      this.#reset();
      return;
    }
    player.setFade(fadeFactor(player.duration - player.position));
  }

  #reset(): void {
    clearInterval(this.#timer);
    this.#timer = undefined;
    this.endsAt = null;
    this.finishing = false;
    player.stopAfterCurrent = false;
    player.setFade(1);
  }
}

export const sleep = new Sleep();
