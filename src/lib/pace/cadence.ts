/**
 * Steps per minute from accelerometer readings. Each step shows up as a bump in the
 * total acceleration; we remove gravity with a slow average, smooth the rest, and count
 * upward crossings of a threshold.
 */

const THRESHOLD = 1; // m/s² above the resting level.
const MIN_STEP_MS = 250; // Faster than 240 steps per minute is noise.
const WINDOW_MS = 10_000;
const MIN_STEPS = 6;

export class CadenceTracker {
  #baseline: number | null = null;
  #smooth = 0;
  #armed = true;
  #steps: number[] = [];

  /** Feed one reading: time in ms and total acceleration (including gravity) in m/s². */
  add(time: number, magnitude: number): void {
    this.#baseline =
      this.#baseline === null ? magnitude : this.#baseline + (magnitude - this.#baseline) * 0.02;
    this.#smooth += (magnitude - this.#baseline - this.#smooth) * 0.3;

    if (this.#armed && this.#smooth > THRESHOLD) {
      const last = this.#steps.at(-1);
      if (last === undefined || time - last >= MIN_STEP_MS) this.#steps.push(time);
      this.#armed = false;
    } else if (this.#smooth < 0) {
      this.#armed = true;
    }
    while (this.#steps.length && time - (this.#steps[0] ?? 0) > WINDOW_MS) this.#steps.shift();
  }

  /** Steps per minute over the last 10 s, or null when not walking steadily. */
  get cadence(): number | null {
    if (this.#steps.length < MIN_STEPS) return null;
    const gaps = this.#steps.slice(1).map((t, i) => t - (this.#steps[i] ?? t));
    gaps.sort((a, b) => a - b);
    const median = gaps[Math.floor(gaps.length / 2)] ?? 0;
    return median > 0 ? Math.round(60_000 / median) : null;
  }
}
