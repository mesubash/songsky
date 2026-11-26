import { describe, expect, it } from 'vitest';
import { interleave, sourceName } from './sources';

const ids = (list: { id: string }[]) => list.map((x) => x.id);

describe('interleave', () => {
  it('takes turns, keeps going when one list runs out, and skips repeats', () => {
    const a = [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }];
    const b = [{ id: 'b1' }, { id: 'a2' }];
    expect(ids(interleave(a, b))).toEqual(['a1', 'b1', 'a2', 'a3']);
    expect(interleave()).toEqual([]);
  });
});

describe('sourceName', () => {
  it('names the service from the song id', () => {
    expect(sourceName({ id: 'audius:1' })).toBe('Audius');
    expect(sourceName({ id: 'jamendo:1' })).toBe('Jamendo');
    expect(sourceName({ id: 'local-file' })).toBeNull();
  });
});
