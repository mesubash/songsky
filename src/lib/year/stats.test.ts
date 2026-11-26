import { describe, expect, it } from 'vitest';
import type { PlayRecord, Track } from '$lib/library/types';
import { describeSky, yearStats } from './stats';

const song = (id: string, artist: string, duration = 120): Track => ({
  id,
  title: id.toUpperCase(),
  artist,
  album: '',
  trackNo: null,
  duration,
  coverId: null,
  source: 'copy',
  addedAt: 0,
});

const at = (month: number, day: number, hour: number) => new Date(2026, month, day, hour).getTime();
const now = new Date(2026, 10, 26, 18);

const byId = new Map([
  ['a', song('a', 'Ana')],
  ['b', song('b', 'Ana')],
  ['c', song('c', 'Bo')],
]);

const plays: PlayRecord[] = [
  {
    trackId: 'a',
    playedAt: at(10, 20, 22),
    weather: 'rain',
    place: { name: 'Kathmandu', latitude: 0, longitude: 0 },
  },
  { trackId: 'a', playedAt: at(10, 21, 23), weather: 'rain' },
  { trackId: 'b', playedAt: at(10, 21, 9), weather: 'clear' },
  { trackId: 'c', playedAt: at(1, 2, 21), weather: 'rain' },
  { trackId: 'c', playedAt: at(0, 1, 12) - 400 * 86_400_000 },
];

describe('yearStats', () => {
  it('counts plays, minutes and days in the range', () => {
    const month = yearStats(plays, byId, 'month', now);
    expect([month.plays, month.minutes, month.days]).toEqual([3, 6, 2]);
    expect(yearStats(plays, byId, 'year', now).plays).toBe(4);
    expect(yearStats(plays, byId, 'all', now).plays).toBe(5);
  });

  it('ranks songs and artists, and finds the favourite sky and place', () => {
    const year = yearStats(plays, byId, 'year', now);
    expect(year.topSongs[0]).toMatchObject({ label: 'A', sub: 'Ana', count: 2 });
    expect(year.topArtists.map((a) => [a.label, a.count])).toEqual([
      ['Ana', 3],
      ['Bo', 1],
    ]);
    expect(year.sky).toEqual({ condition: 'rain', time: 'night', count: 3 });
    expect(year.topPlace).toEqual({ label: 'Kathmandu', count: 1 });
  });

  it('is empty without plays', () => {
    const empty = yearStats([], byId, 'year', now);
    expect([empty.plays, empty.sky, empty.firstPlay]).toEqual([0, null, null]);
  });
});

describe('describeSky', () => {
  it('reads naturally', () => {
    expect(describeSky({ condition: 'rain', time: 'night' })).toBe('Rainy nights');
    expect(describeSky({ condition: null, time: 'dusk' })).toBe('Evenings');
  });
});
