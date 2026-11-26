import { describe, expect, it } from 'vitest';
import { camelotDistance, mixOrder, tempoGap, transitionCost } from './mix';

describe('camelotDistance', () => {
  it.each([
    ['8A', '8A', 0],
    ['8A', '9A', 1],
    ['8A', '8B', 1],
    ['12A', '1A', 1],
    ['8A', '2A', 6],
    ['8A', '10B', 3],
  ])('%s → %s is %i', (a, b, d) => expect(camelotDistance(a, b)).toBe(d));
});

describe('tempoGap', () => {
  it('is zero for the same tempo and for half or double time', () => {
    expect(tempoGap(120, 120)).toBe(0);
    expect(tempoGap(120, 60)).toBe(0);
    expect(tempoGap(85, 170)).toBe(0);
  });

  it('is a percentage otherwise', () => expect(tempoGap(100, 110)).toBeCloseTo(10));
});

describe('transitionCost', () => {
  it('prefers a compatible key at the same tempo', () => {
    const from = { id: 'a', bpm: 120, camelot: '8A' };
    expect(transitionCost(from, { id: 'b', bpm: 120, camelot: '9A' })).toBe(0);
    expect(transitionCost(from, { id: 'c', bpm: 120, camelot: '2A' })).toBeGreaterThan(0);
  });

  it('puts unanalysed songs after analysed ones', () => {
    const from = { id: 'a', bpm: 120, camelot: '8A' };
    expect(transitionCost(from, { id: 'x' })).toBeGreaterThan(
      transitionCost(from, { id: 'b', bpm: 126, camelot: '10A' }),
    );
  });
});

describe('mixOrder', () => {
  it('chains songs by tempo and key, starting where asked', () => {
    const tracks = [
      { id: 'slow', bpm: 80, camelot: '3A' },
      { id: 'mid-a', bpm: 120, camelot: '8A' },
      { id: 'fast', bpm: 140, camelot: '8A' },
      { id: 'mid-b', bpm: 121, camelot: '9A' },
    ];
    const order = mixOrder(tracks, 'mid-a');
    expect(order[0]).toBe('mid-a');
    expect(order[1]).toBe('mid-b');
    expect(order).toHaveLength(4);
    expect(new Set(order).size).toBe(4);
  });

  it('handles an empty list', () => expect(mixOrder([], 'x')).toEqual([]));
});
