/**
 * Turning analyser data into a small set of levels, and drawing those levels as a
 * horizon. Shared by the live visualizer and the song art.
 */

export const BANDS = 32;
const MIN_HZ = 40;
const MAX_HZ = 16000;

export type BinRange = [start: number, end: number];

/** Analyser bin ranges on a log scale, so each band covers a similar musical slice. */
export function bandRanges(sampleRate: number, fftSize: number, bands = BANDS): BinRange[] {
  const hzPerBin = sampleRate / fftSize;
  const ratio = MAX_HZ / MIN_HZ;
  return Array.from({ length: bands }, (_, i) => {
    const from = MIN_HZ * ratio ** (i / bands);
    const to = MIN_HZ * ratio ** ((i + 1) / bands);
    const start = Math.floor(from / hzPerBin);
    return [start, Math.max(start + 1, Math.ceil(to / hzPerBin))];
  });
}

/** Average byte frequency data into 0..1 levels, one per range. */
export function readBands(data: Uint8Array, ranges: BinRange[], out: Float32Array): Float32Array {
  ranges.forEach(([start, end], i) => {
    let sum = 0;
    for (let bin = start; bin < end; bin++) sum += data[bin] ?? 0;
    out[i] = sum / (end - start) / 255;
  });
  return out;
}

/**
 * Traces a smooth horizon through `levels`, mirrored so bass rises in the middle and
 * highs fall away at both edges. Leaves the path open along the top edge for stroking.
 */
export function traceHorizon(
  context: CanvasRenderingContext2D,
  levels: ArrayLike<number>,
  box: { x: number; y: number; width: number; height: number },
): void {
  const values = [...Array.from(levels).reverse(), ...Array.from(levels)];
  const step = box.width / (values.length - 1);
  const yOf = (v: number) => box.y + box.height - v * box.height;

  context.beginPath();
  context.moveTo(box.x, yOf(values[0] ?? 0));
  for (let i = 1; i < values.length; i++) {
    const x = box.x + i * step;
    const midX = x - step / 2;
    const prev = yOf(values[i - 1] ?? 0);
    const next = yOf(values[i] ?? 0);
    context.bezierCurveTo(midX, prev, midX, next, x, next);
  }
}
