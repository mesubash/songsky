import type { Track } from './types';

export type SortOrder = 'artist' | 'title' | 'added' | 'tempo';

export const SORT_LABELS: Record<SortOrder, string> = {
  artist: 'Artist and album',
  title: 'Title',
  added: 'Recently added',
  tempo: 'Tempo',
};

/** Ignores case and accents, so "beyonce" finds "Beyoncé". */
const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const compare: Record<SortOrder, (a: Track, b: Track) => number> = {
  // The library is already kept in artist, album, track order.
  artist: () => 0,
  title: (a, b) => a.title.localeCompare(b.title),
  added: (a, b) => b.addedAt - a.addedAt,
  // Songs without a tempo go last.
  tempo: (a, b) => (a.bpm ?? Number.POSITIVE_INFINITY) - (b.bpm ?? Number.POSITIVE_INFINITY),
};

/** Songs whose title, artist or album contain every word of the query, in the chosen order. */
export function browse(tracks: readonly Track[], query: string, order: SortOrder): Track[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  const found = words.length
    ? tracks.filter((track) => {
        const text = fold(`${track.title} ${track.artist} ${track.album}`);
        return words.every((word) => text.includes(word));
      })
    : [...tracks];
  return found.sort(compare[order]);
}
