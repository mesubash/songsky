import type { PlayRecord, Track } from '$lib/library/types';
import { type Sky, skyForHour } from '$lib/sky/time';
import type { Condition } from '$lib/sky/weather';

export type Range = 'month' | 'year' | 'all';

export interface Ranked {
  label: string;
  sub?: string;
  count: number;
  trackId?: string;
}

export interface YearStats {
  plays: number;
  minutes: number;
  days: number;
  topSongs: Ranked[];
  topArtists: Ranked[];
  /** The sky you listened under most, e.g. rain at night. */
  sky: { condition: Condition | null; time: Sky; count: number } | null;
  topPlace: Ranked | null;
  firstPlay: number | null;
}

/** When the range starts: the 1st of this month, 1 January, or the beginning of time. */
export function rangeStart(range: Range, now: Date): number {
  if (range === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  if (range === 'year') return new Date(now.getFullYear(), 0, 1).getTime();
  return 0;
}

function rank<T>(items: Iterable<T>, key: (item: T) => string | null, limit: number) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

/** Listening stats for a time range, from play history and the songs it refers to. */
export function yearStats(
  plays: readonly PlayRecord[],
  byId: ReadonlyMap<string, Track>,
  range: Range,
  now = new Date(),
): YearStats {
  const from = rangeStart(range, now);
  const inRange = plays.filter((p) => p.playedAt >= from && p.playedAt <= now.getTime());
  const track = (p: PlayRecord) => byId.get(p.trackId) ?? p.stream;

  const topSongs = rank(inRange, (p) => p.trackId, 5).map(([id, count]) => {
    const t = byId.get(id) ?? inRange.find((p) => p.trackId === id)?.stream;
    return { label: t?.title ?? 'Unknown song', sub: t?.artist, count, trackId: id };
  });
  const topArtists = rank(inRange, (p) => track(p)?.artist ?? null, 5).map(([label, count]) => ({
    label,
    count,
  }));
  const skies = rank(
    inRange,
    (p) => `${p.weather ?? ''}|${skyForHour(new Date(p.playedAt).getHours())}`,
    1,
  );
  const sky = skies[0]
    ? (() => {
        const [key, count] = skies[0];
        const [condition, time] = key.split('|');
        return { condition: (condition || null) as Condition | null, time: time as Sky, count };
      })()
    : null;
  const places = rank(inRange, (p) => p.place?.name ?? null, 1);
  const days = new Set(inRange.map((p) => new Date(p.playedAt).toDateString())).size;
  const seconds = inRange.reduce((sum, p) => sum + (track(p)?.duration ?? 0), 0);

  return {
    plays: inRange.length,
    minutes: Math.round(seconds / 60),
    days,
    topSongs,
    topArtists,
    sky,
    topPlace: places[0] ? { label: places[0][0], count: places[0][1] } : null,
    firstPlay: inRange.length ? Math.min(...inRange.map((p) => p.playedAt)) : null,
  };
}

const CONDITION_WORDS: Record<Condition, string> = {
  clear: 'clear',
  cloudy: 'cloudy',
  fog: 'foggy',
  rain: 'rainy',
  snow: 'snowy',
  storm: 'stormy',
};
const TIME_WORDS: Record<Sky, string> = {
  dawn: 'mornings',
  day: 'days',
  dusk: 'evenings',
  night: 'nights',
};

/** "Rainy nights", or just "Evenings" when the weather wasn't recorded. */
export function describeSky(sky: { condition: Condition | null; time: Sky }): string {
  const time = TIME_WORDS[sky.time];
  const phrase = sky.condition ? `${CONDITION_WORDS[sky.condition]} ${time}` : time;
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}
