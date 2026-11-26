import { describe, expect, it } from 'vitest';
import { fadeFactor, formatRemaining } from './fade';

describe('fadeFactor', () => {
  it('stays at full volume until the last 30 seconds', () => {
    expect(fadeFactor(120)).toBe(1);
    expect(fadeFactor(30)).toBe(1);
  });

  it('fades linearly to silence', () => {
    expect(fadeFactor(15)).toBeCloseTo(0.5);
    expect(fadeFactor(0)).toBe(0);
    expect(fadeFactor(-2)).toBe(0);
  });

  it('ignores an unknown length', () => expect(fadeFactor(Number.NaN)).toBe(1));
});

describe('formatRemaining', () => {
  it.each([
    [30_000, 'under a minute'],
    [60_000, '1 min'],
    [12 * 60_000 - 1, '12 min'],
    [65 * 60_000, '1 h 5 min'],
  ])('%i ms → %s', (ms, text) => expect(formatRemaining(ms)).toBe(text));
});
