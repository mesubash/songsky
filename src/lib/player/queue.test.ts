import { describe, expect, it } from 'vitest';
import {
  addToEnd,
  moveTo,
  moveToNext,
  nextIndex,
  prevIndex,
  removeAt,
  shuffledWithFirst,
} from './queue';

describe('shuffledWithFirst', () => {
  const ids = ['a', 'b', 'c', 'd', 'e'];

  it('keeps the first id at the front and every id exactly once', () => {
    const result = shuffledWithFirst(ids, 'c');
    expect(result[0]).toBe('c');
    expect([...result].sort()).toEqual(ids);
  });

  it('actually reorders the rest', () => {
    const result = shuffledWithFirst(ids, 'a', () => 0);
    expect(result).not.toEqual(ids);
  });

  it('ignores an unknown first id', () => {
    expect(shuffledWithFirst(ids, 'zzz').sort()).toEqual(ids);
  });
});

describe('nextIndex', () => {
  it('moves forward', () => expect(nextIndex(3, 0, 'off', false)).toBe(1));
  it('stops at the end with repeat off', () => expect(nextIndex(3, 2, 'off', true)).toBeNull());
  it('wraps with repeat all', () => expect(nextIndex(3, 2, 'all', true)).toBe(0));
  it('replays when a song ends on repeat one', () => expect(nextIndex(3, 1, 'one', true)).toBe(1));
  it('skips forward on repeat one when pressed', () =>
    expect(nextIndex(3, 1, 'one', false)).toBe(2));
  it('handles an empty queue', () => expect(nextIndex(0, 0, 'all', true)).toBeNull());
});

describe('prevIndex', () => {
  it('moves back', () => expect(prevIndex(3, 2, 'off')).toBe(1));
  it('restarts at the start with repeat off', () => expect(prevIndex(3, 0, 'off')).toBeNull());
  it('wraps with repeat all', () => expect(prevIndex(3, 0, 'all')).toBe(2));
});

describe('moveToNext', () => {
  it('moves a later song up to play next', () => {
    expect(moveToNext(['a', 'b', 'c', 'd'], 1, 'd')).toEqual({
      queue: ['a', 'b', 'd', 'c'],
      index: 1,
    });
  });

  it('moves an earlier song forward and keeps the current one playing', () => {
    expect(moveToNext(['a', 'b', 'c'], 2, 'a')).toEqual({ queue: ['b', 'c', 'a'], index: 1 });
  });

  it('adds a song that isn’t queued', () => {
    expect(moveToNext(['a', 'b'], 0, 'z')).toEqual({ queue: ['a', 'z', 'b'], index: 0 });
  });

  it('leaves the queue alone for the current song', () => {
    expect(moveToNext(['a', 'b'], 0, 'a')).toEqual({ queue: ['a', 'b'], index: 0 });
  });
});

describe('queue editing', () => {
  const q = ['a', 'b', 'c', 'd'];

  it('adds to the end, or moves a coming-up song there', () => {
    expect(addToEnd(q, 1, 'e')).toEqual({ queue: ['a', 'b', 'c', 'd', 'e'], index: 1 });
    expect(addToEnd(q, 1, 'c')).toEqual({ queue: ['a', 'b', 'd', 'c'], index: 1 });
    expect(addToEnd(q, 1, 'a')).toEqual({ queue: ['b', 'c', 'd', 'a'], index: 0 });
    expect(addToEnd(q, 1, 'b')).toEqual({ queue: q, index: 1 });
  });

  it('removes songs but never the playing one', () => {
    expect(removeAt(q, 1, 3)).toEqual({ queue: ['a', 'b', 'c'], index: 1 });
    expect(removeAt(q, 1, 0)).toEqual({ queue: ['b', 'c', 'd'], index: 0 });
    expect(removeAt(q, 1, 1)).toEqual({ queue: q, index: 1 });
  });

  it('moves songs and follows the playing one', () => {
    expect(moveTo(q, 1, 3, 2)).toEqual({ queue: ['a', 'b', 'd', 'c'], index: 1 });
    expect(moveTo(q, 1, 1, 3)).toEqual({ queue: ['a', 'c', 'd', 'b'], index: 3 });
    expect(moveTo(q, 2, 0, 3)).toEqual({ queue: ['b', 'c', 'd', 'a'], index: 1 });
  });
});
