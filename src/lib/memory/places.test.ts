import { describe, expect, it } from 'vitest';
import type { PlayRecord } from '$lib/library/types';
import { groupByDay, groupByPlace, timeAgo } from './places';

const kathmandu = { name: 'Kathmandu', latitude: 27.7, longitude: 85.3 };
const pokhara = { name: 'Pokhara', latitude: 28.2, longitude: 84 };

describe('groupByPlace', () => {
  const plays: PlayRecord[] = [
    { trackId: 'a', playedAt: 1, place: kathmandu },
    { trackId: 'b', playedAt: 5, place: kathmandu },
    { trackId: 'a', playedAt: 3, place: kathmandu },
    { trackId: 'c', playedAt: 2, place: pokhara },
    { trackId: 'd', playedAt: 9 },
  ];
  const places = groupByPlace(plays);

  it('skips plays without a place and puts the busiest place first', () => {
    expect(places.map((p) => [p.name, p.count])).toEqual([
      ['Kathmandu', 3],
      ['Pokhara', 1],
    ]);
  });

  it('ranks songs within a place and tracks the latest play', () => {
    expect(places[0]?.top).toEqual([
      { trackId: 'a', count: 2 },
      { trackId: 'b', count: 1 },
    ]);
    expect(places[0]?.lastPlayed).toBe(5);
  });
});

describe('timeAgo', () => {
  const now = new Date(2026, 10, 26, 12).getTime();
  const minus = (ms: number) => now - ms;

  it.each([
    [minus(10_000), 'just now'],
    [minus(5 * 60_000), '5 min ago'],
    [minus(3 * 3_600_000), '3 h ago'],
    [minus(26 * 3_600_000), 'yesterday'],
    [minus(4 * 86_400_000), '4 days ago'],
    [minus(30 * 86_400_000), '27 Oct 2026'],
  ])('%s → %s', (then, text) => expect(timeAgo(then, now)).toBe(text));
});

describe('groupByDay', () => {
  const now = new Date(2026, 10, 26, 15).getTime();
  const at = (day: number, hour: number) => new Date(2026, 10, day, hour).getTime();

  it('labels today and yesterday, then dates, newest first', () => {
    const groups = groupByDay(
      [
        { playedAt: at(24, 9) },
        { playedAt: at(26, 10) },
        { playedAt: at(25, 22) },
        { playedAt: at(26, 14) },
      ],
      now,
    );
    expect(groups.map((g) => [g.label, g.plays.length])).toEqual([
      ['Today', 2],
      ['Yesterday', 1],
      ['Tue 24 Nov', 1],
    ]);
    expect(groups[0]?.plays[0]?.playedAt).toBe(at(26, 14));
  });
});
