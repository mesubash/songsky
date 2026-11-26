import { describe, expect, it } from 'vitest';
import { BANDS } from '$lib/audio/spectrum';
import { normalize, SongprintStore, seededLevels } from './songprint';

describe('seededLevels', () => {
  it('is the same for the same seed and different for another', () => {
    expect(seededLevels('song-a')).toEqual(seededLevels('song-a'));
    expect(seededLevels('song-a')).not.toEqual(seededLevels('song-b'));
  });

  it('stays within 0..1 and peaks at 1', () => {
    const levels = seededLevels('anything');
    expect(levels).toHaveLength(BANDS);
    expect(Math.max(...levels)).toBeCloseTo(1);
    expect(Math.min(...levels)).toBeGreaterThan(0);
  });
});

describe('normalize', () => {
  it('scales the peak to 1 and keeps a floor', () => {
    expect(normalize([0, 0.5])).toEqual([0.12, 1]);
  });
});

describe('SongprintStore', () => {
  it('falls back to the seeded shape until enough has been heard', () => {
    const store = new SongprintStore();
    store.add('x', new Array(BANDS).fill(0.5));
    expect(store.levels('x')).toEqual(seededLevels('x'));
  });

  it('averages what was heard once there is enough', () => {
    const store = new SongprintStore();
    const bassy = Array.from({ length: BANDS }, (_, i) => (i === 0 ? 1 : 0.25));
    for (let i = 0; i < SongprintStore.MIN_SAMPLES; i++) store.add('x', bassy);
    const levels = store.levels('x');
    expect(levels[0]).toBeCloseTo(1);
    expect(levels[1]).toBeCloseTo(0.12 + 0.88 * 0.25);
  });
});
