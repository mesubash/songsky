import { tempoGap } from '$lib/analysis/mix';
import { library } from '$lib/library/library.svelte';
import { player } from '$lib/player/player.svelte';
import { CadenceTracker } from './cadence';

/** How often the next song is re-picked while moving. */
const PICK_MS = 5000;

interface MotionPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

/** Only phones and tablets have a motion sensor worth asking for. */
export const paceSupported =
  typeof window !== 'undefined' &&
  'DeviceMotionEvent' in window &&
  matchMedia('(pointer: coarse)').matches;

/**
 * Pace match: listens to the motion sensor and keeps the next song close to the
 * listener's steps per minute (or half or double, so 170 steps fits an 85 BPM song).
 */
class Pace {
  active = $state(false);
  cadence = $state<number | null>(null);
  error = $state<string | null>(null);

  #tracker = new CadenceTracker();
  #timer: ReturnType<typeof setInterval> | undefined;
  #onMotion = (event: DeviceMotionEvent) => {
    const a = event.accelerationIncludingGravity;
    if (a?.x == null || a.y == null || a.z == null) return;
    this.#tracker.add(event.timeStamp, Math.hypot(a.x, a.y, a.z));
  };

  /** Must be called from a tap: iOS only shows its permission prompt for a user action. */
  async start(): Promise<void> {
    this.error = null;
    const request = (DeviceMotionEvent as unknown as MotionPermission).requestPermission;
    if (request) {
      try {
        if ((await request()) !== 'granted') {
          this.error = 'Motion access wasn’t allowed. You can turn it on in Safari settings.';
          return;
        }
      } catch {
        this.error = 'Motion access needs a secure (https) connection.';
        return;
      }
    }

    this.#tracker = new CadenceTracker();
    addEventListener('devicemotion', this.#onMotion);
    this.#timer = setInterval(() => this.#tick(), PICK_MS);
    this.active = true;
  }

  stop(): void {
    removeEventListener('devicemotion', this.#onMotion);
    clearInterval(this.#timer);
    this.active = false;
    this.cadence = null;
  }

  #tick(): void {
    this.cadence = this.#tracker.cadence;
    const cadence = this.cadence;
    if (!cadence) return;

    // Choose among the songs still to come.
    const upcoming = player.queue.slice(player.index + 1);
    let best: string | undefined;
    let bestGap = Infinity;
    for (const id of upcoming) {
      const bpm = library.byId.get(id)?.bpm;
      if (!bpm) continue;
      const gap = tempoGap(cadence, bpm);
      if (gap < bestGap) {
        bestGap = gap;
        best = id;
      }
    }
    if (best) player.playNextUp(best);
  }
}

export const pace = new Pace();
