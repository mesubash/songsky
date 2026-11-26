import type { PlayRecord } from '$lib/library/types';

export interface PlacePlays {
  key: string;
  name: string;
  latitude: number;
  longitude: number;
  count: number;
  lastPlayed: number;
  /** Most played songs here, most first. */
  top: { trackId: string; count: number }[];
}

/** Groups plays that have a place by that place, busiest first. */
export function groupByPlace(plays: readonly PlayRecord[], topCount = 3): PlacePlays[] {
  const places = new Map<string, PlacePlays & { counts: Map<string, number> }>();

  for (const play of plays) {
    if (!play.place) continue;
    const key = `${play.place.latitude},${play.place.longitude}`;
    let entry = places.get(key);
    if (!entry) {
      entry = { key, ...play.place, count: 0, lastPlayed: 0, top: [], counts: new Map() };
      places.set(key, entry);
    }
    entry.count++;
    entry.lastPlayed = Math.max(entry.lastPlayed, play.playedAt);
    entry.counts.set(play.trackId, (entry.counts.get(play.trackId) ?? 0) + 1);
  }

  return [...places.values()]
    .map(({ counts, ...place }) => ({
      ...place,
      top: [...counts]
        .map(([trackId, count]) => ({ trackId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, topCount),
    }))
    .sort((a, b) => b.count - a.count);
}

/** "just now", "5 min ago", "3 h ago", "yesterday", "4 days ago", or a date. */
export function timeAgo(then: number, now = Date.now()): string {
  const minutes = Math.round((now - then) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(then).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
