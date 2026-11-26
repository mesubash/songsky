import type { Track } from '$lib/library/types';

/** Lyrics from LRCLIB, a free, open lyrics library. Synced lines when it has them. */
const API = 'https://lrclib.net/api';

export interface LyricLine {
  /** Seconds from the start of the song. */
  time: number;
  text: string;
}

export type Lyrics =
  | { kind: 'synced'; lines: LyricLine[] }
  | { kind: 'plain'; text: string }
  | { kind: 'instrumental' }
  | { kind: 'none' };

/** Reads "[01:02.34] words" lines, sorted by time. Lines without a time are dropped. */
export function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const raw of lrc.split('\n')) {
    const stamps = [...raw.matchAll(/\[(\d{1,3}):(\d{2}(?:\.\d{1,3})?)\]/g)];
    if (!stamps.length) continue;
    const text = raw.replace(/\[[^\]]*\]/g, '').trim();
    for (const stamp of stamps) {
      lines.push({ time: Number(stamp[1]) * 60 + Number(stamp[2]), text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

/** The line being sung at `time`: the last one that has started. */
export function currentLine(lines: readonly LyricLine[], time: number): number {
  let index = -1;
  for (let i = 0; i < lines.length; i++) {
    if ((lines[i]?.time ?? 0) <= time) index = i;
    else break;
  }
  return index;
}

/**
 * Titles from streaming sites often carry extras that lyric sites don't: "Artist - Title",
 * "(Remix)", "[Official]", "feat. X". This finds the plain song name and who sang it.
 */
export function cleanTitle(title: string, artist: string): { title: string; artist: string } {
  const strip = (t: string) =>
    t
      .replace(/\s*[([][^)\]]*[)\]]/g, '')
      .replace(/\s+(feat\.?|ft\.?|featuring)\s.*$/i, '')
      .trim();
  const [before, ...rest] = title.split(' - ');
  const after = rest.join(' - ');
  if (!before || !after) return { title: strip(title), artist };
  // "Jenny - Steve Aoki & 3LAU": the part after names the artist, so the song is before.
  if (strip(after).toLowerCase().includes(artist.toLowerCase())) {
    return { title: strip(before), artist };
  }
  // "Kate Bush - Running Up That Hill": the usual Artist - Title, often a remix upload.
  return { title: strip(after), artist: strip(before) || artist };
}

interface LrclibRecord {
  instrumental?: boolean;
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
}

function toLyrics(record: LrclibRecord | null | undefined): Lyrics {
  if (!record) return { kind: 'none' };
  if (record.instrumental) return { kind: 'instrumental' };
  if (record.syncedLyrics) {
    const lines = parseLrc(record.syncedLyrics);
    if (lines.length) return { kind: 'synced', lines };
  }
  if (record.plainLyrics?.trim()) return { kind: 'plain', text: record.plainLyrics.trim() };
  return { kind: 'none' };
}

const cache = new Map<string, Promise<Lyrics>>();

/** Looks up lyrics for a song: an exact match first, then a search. Cached for the visit. */
export function lyricsFor(
  track: Pick<Track, 'id' | 'title' | 'artist' | 'duration'>,
): Promise<Lyrics> {
  let found = cache.get(track.id);
  if (!found) {
    found = find(track).catch(() => ({ kind: 'none' }) as Lyrics);
    cache.set(track.id, found);
  }
  return found;
}

async function find(track: Pick<Track, 'title' | 'artist' | 'duration'>): Promise<Lyrics> {
  const { title, artist } = cleanTitle(track.title, track.artist);
  const exact = new URLSearchParams({ track_name: title, artist_name: artist });
  if (track.duration) exact.set('duration', String(Math.round(track.duration)));
  const response = await fetch(`${API}/get?${exact}`);
  if (response.ok) {
    const lyrics = toLyrics(await response.json());
    if (lyrics.kind !== 'none') return lyrics;
  }
  const search = await fetch(`${API}/search?${new URLSearchParams({ q: `${title} ${artist}` })}`);
  if (!search.ok) return { kind: 'none' };
  const results: LrclibRecord[] = await search.json();
  // Prefer a synced result.
  const best = results.find((r) => r.syncedLyrics) ?? results[0];
  return toLyrics(best);
}
