/** Ordering songs so each one flows into the next: close tempo and a compatible key. */

export interface MixTrack {
  id: string;
  bpm?: number;
  /** Camelot code, e.g. "8A". */
  camelot?: string;
}

/** Steps around the Camelot wheel between two codes; switching A/B at the same number is 1. */
export function camelotDistance(a: string, b: string): number {
  const parse = (code: string) => ({ n: Number.parseInt(code, 10), mode: code.slice(-1) });
  const x = parse(a);
  const y = parse(b);
  const around = Math.min((x.n - y.n + 12) % 12, (y.n - x.n + 12) % 12);
  return around + (x.mode === y.mode ? 0 : 1);
}

/** Tempo difference in percent, treating half and double time as the same groove. */
export function tempoGap(a: number, b: number): number {
  const ratios = [b / a, (b * 2) / a, b / (a * 2)];
  return Math.min(...ratios.map((r) => Math.abs(r - 1))) * 100;
}

const UNKNOWN_PENALTY = 12;
const KEY_STEP_PENALTY = 4;

/** Lower is smoother. Neighbouring keys (distance ≤ 1) are free; beyond that each step costs. */
export function transitionCost(from: MixTrack, to: MixTrack): number {
  const tempo = from.bpm && to.bpm ? tempoGap(from.bpm, to.bpm) : UNKNOWN_PENALTY;
  const key =
    from.camelot && to.camelot
      ? Math.max(0, camelotDistance(from.camelot, to.camelot) - 1) * KEY_STEP_PENALTY
      : UNKNOWN_PENALTY;
  return tempo + key;
}

/**
 * Greedy mix order: start at `startId`, then always take the smoothest next song.
 * ponytail: O(n²); fine for thousands of songs, switch to bucketing by tempo if not.
 */
export function mixOrder(tracks: readonly MixTrack[], startId: string): string[] {
  const left = new Map(tracks.map((t) => [t.id, t]));
  let current = left.get(startId) ?? tracks[0];
  if (!current) return [];
  const order = [current.id];
  left.delete(current.id);

  while (left.size > 0) {
    let best: MixTrack | undefined;
    let bestCost = Infinity;
    for (const candidate of left.values()) {
      const cost = transitionCost(current, candidate);
      if (cost < bestCost) {
        bestCost = cost;
        best = candidate;
      }
    }
    if (!best) break;
    order.push(best.id);
    left.delete(best.id);
    current = best;
  }
  return order;
}
