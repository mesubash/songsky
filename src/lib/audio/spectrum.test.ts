import { describe, expect, it } from 'vitest';
import { bandRanges, readBands } from './spectrum';

describe('bandRanges', () => {
  const ranges = bandRanges(48000, 2048);

  it('covers every band with at least one bin, in rising order', () => {
    expect(ranges).toHaveLength(32);
    for (const [start, end] of ranges) expect(end).toBeGreaterThan(start);
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i]?.[0]).toBeGreaterThanOrEqual(ranges[i - 1]?.[0] ?? 0);
    }
  });
});

describe('readBands', () => {
  it('averages bins into 0..1 levels', () => {
    const data = new Uint8Array([255, 255, 0, 0, 51, 51]);
    const out = readBands(
      data,
      [
        [0, 2],
        [2, 4],
        [4, 6],
      ],
      new Float32Array(3),
    );
    expect([...out].map((v) => Number(v.toFixed(2)))).toEqual([1, 0, 0.2]);
  });
});
