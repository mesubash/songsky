import { BANDS } from '$lib/audio/spectrum';

/**
 * A song's "songprint": its average spectrum while it played, scaled so the loudest band
 * reaches 1. Different songs get different shapes; the same song gets the same shape.
 */
export class SongprintStore {
  #sums = new Map<string, { sum: Float32Array; count: number }>();
  /** Samples needed before the live shape is trusted (about 10 s at 2 per second). */
  static readonly MIN_SAMPLES = 20;

  add(id: string, levels: ArrayLike<number>): void {
    let entry = this.#sums.get(id);
    if (!entry) {
      entry = { sum: new Float32Array(BANDS), count: 0 };
      this.#sums.set(id, entry);
    }
    for (let i = 0; i < BANDS; i++) entry.sum[i] = (entry.sum[i] ?? 0) + (levels[i] ?? 0);
    entry.count++;
  }

  /** The listened shape, or a shape made from the id when there isn't enough listening yet. */
  levels(id: string): number[] {
    const entry = this.#sums.get(id);
    if (!entry || entry.count < SongprintStore.MIN_SAMPLES) return seededLevels(id);
    return normalize(Array.from(entry.sum, (v) => v / entry.count));
  }
}

/** Scales levels so the highest is 1, keeping a gentle floor so the horizon never goes flat. */
export function normalize(levels: number[]): number[] {
  const max = Math.max(...levels, 1e-6);
  return levels.map((v) => 0.12 + 0.88 * (v / max));
}

/** Deterministic, music-like levels from any string: bass-heavy with gentle bumps. */
export function seededLevels(seed: string, bands = BANDS): number[] {
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  const random = () => {
    hash = Math.imul(hash ^ (hash >>> 15), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    hash ^= hash >>> 16;
    return (hash >>> 0) / 4294967296;
  };

  const raw = Array.from({ length: bands }, (_, i) => {
    const tilt = 1 - (i / bands) * 0.7; // Real music has more energy in the bass.
    return tilt * (0.45 + random() * 0.55);
  });
  // Smooth neighbours so it reads as hills, not noise.
  const smooth = raw.map((v, i) => ((raw[i - 1] ?? v) + v * 2 + (raw[i + 1] ?? v)) / 4);
  return normalize(smooth);
}
