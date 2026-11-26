import { camelot, keyName, parseKeyName } from '$lib/analysis/key';
import type { Track } from '$lib/library/types';

/**
 * Audius: free, legal music uploaded by its artists. No key is needed; apps identify
 * themselves with app_name. Streams allow cross-site use, so the EQ, crossfade and
 * visualizer all work on them.
 */
const API = 'https://api.audius.co/v1';
const APP_NAME = 'Songsky';
const SITE = 'https://audius.co';

export const AUDIUS_PREFIX = 'audius:';

export function audiusStreamUrl(audiusId: string): string {
  return `${API}/tracks/${encodeURIComponent(audiusId)}/stream?app_name=${APP_NAME}`;
}

/** Only Audius stream links are allowed as stream sources (they are shared in Listen together). */
export function isAudiusStreamUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.origin === new URL(API).origin && /^\/v1\/tracks\/[^/]+\/stream$/.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
};

/** Some titles arrive HTML-encoded ("Chill &amp; Lofi"); show them as written. */
export function decodeEntities(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|apos|#39);/g, (_, name: string) => ENTITIES[name] ?? _);
}

const text = (value: unknown, max = 200): string | null =>
  typeof value === 'string' && value.trim() ? decodeEntities(value.trim()).slice(0, max) : null;
const httpsUrl = (value: unknown): string | undefined =>
  typeof value === 'string' && value.startsWith('https://') ? value : undefined;

/** Turns one Audius API track into a Songsky track, or null if it can't be played freely. */
export function readAudiusTrack(raw: unknown, now = Date.now()): Track | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const t = raw as Record<string, unknown>;
  const user = (t.user ?? {}) as Record<string, unknown>;
  const id = text(t.id, 40);
  const title = text(t.title);
  const artist = text(user.name) ?? text(user.handle);
  const duration = typeof t.duration === 'number' && t.duration > 0 ? t.duration : 0;
  const playable =
    t.is_streamable !== false &&
    t.is_stream_gated !== true &&
    t.is_delete !== true &&
    t.is_available !== false;
  if (!id || !title || !artist || !playable) return null;

  const track: Track = {
    id: `${AUDIUS_PREFIX}${id}`,
    title,
    artist,
    album: '',
    trackNo: null,
    duration,
    coverId: null,
    source: 'stream',
    streamUrl: audiusStreamUrl(id),
    artworkUrl: httpsUrl((t.artwork as Record<string, unknown> | undefined)?.['480x480']),
    link:
      typeof t.permalink === 'string' && t.permalink.startsWith('/')
        ? `${SITE}${t.permalink}`
        : undefined,
    artistLink: text(user.handle)
      ? `${SITE}/${encodeURIComponent(String(user.handle))}`
      : undefined,
    addedAt: now,
  };

  if (typeof t.bpm === 'number' && t.bpm >= 40 && t.bpm <= 250) track.bpm = Math.round(t.bpm);
  const key = typeof t.musical_key === 'string' ? parseKeyName(t.musical_key) : null;
  if (key) {
    track.key = keyName(key);
    track.camelot = camelot(key);
  }
  // Audius already knows tempo and key, so there is nothing left to analyse.
  if (track.bpm && track.key) track.analyzedAt = now;
  return track;
}

async function get(path: string, params: Record<string, string> = {}): Promise<Track[]> {
  const query = new URLSearchParams({ ...params, app_name: APP_NAME });
  const response = await fetch(`${API}${path}?${query}`);
  if (!response.ok) throw new Error(`Audius request failed: ${response.status}`);
  const body: { data?: unknown } = await response.json();
  if (!Array.isArray(body.data)) return [];
  return body.data.map((raw) => readAudiusTrack(raw)).filter((t): t is Track => t !== null);
}

export type TrendingTime = 'week' | 'month' | 'year' | 'allTime';

/** Trending songs, overall or in one genre (Audius genre names, e.g. "Lo-Fi"). */
export function trending(
  limit = 20,
  time: TrendingTime = 'week',
  genre?: string,
): Promise<Track[]> {
  const params: Record<string, string> = { time, limit: String(limit) };
  if (genre) params.genre = genre;
  return get('/tracks/trending', params);
}

/** A playlist from Audius, as shown in Discover. */
export interface AudiusPlaylist {
  id: string;
  name: string;
  owner: string;
  artworkUrl?: string;
  trackCount: number;
  link?: string;
}

/** Turns one Audius API playlist into an AudiusPlaylist, or null if it isn't public. */
export function readAudiusPlaylist(raw: unknown): AudiusPlaylist | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const p = raw as Record<string, unknown>;
  const user = (p.user ?? {}) as Record<string, unknown>;
  const id = text(p.id, 40);
  const name = text(p.playlist_name);
  const count = typeof p.track_count === 'number' ? p.track_count : 0;
  if (!id || !name || p.is_private === true || p.is_stream_gated === true || count < 1) return null;
  return {
    id,
    name,
    owner: text(user.name) ?? text(user.handle) ?? 'Audius',
    artworkUrl: httpsUrl((p.artwork as Record<string, unknown> | undefined)?.['480x480']),
    trackCount: count,
    link:
      typeof p.permalink === 'string' && p.permalink.startsWith('/')
        ? `${SITE}${p.permalink}`
        : undefined,
  };
}

export async function trendingPlaylists(limit = 24): Promise<AudiusPlaylist[]> {
  const query = new URLSearchParams({ time: 'week', limit: String(limit), app_name: APP_NAME });
  const response = await fetch(`${API}/playlists/trending?${query}`);
  if (!response.ok) throw new Error(`Audius request failed: ${response.status}`);
  const body: { data?: unknown } = await response.json();
  if (!Array.isArray(body.data)) return [];
  return body.data.map(readAudiusPlaylist).filter((p): p is AudiusPlaylist => p !== null);
}

/** Songs by their Audius ids (without the "audius:" prefix), in one request. */
export function tracksByIds(ids: readonly string[]): Promise<Track[]> {
  if (!ids.length) return Promise.resolve([]);
  const query = new URLSearchParams({ app_name: APP_NAME });
  for (const id of ids) query.append('id', id);
  return fetch(`${API}/tracks?${query}`)
    .then((response) => {
      if (!response.ok) throw new Error(`Audius request failed: ${response.status}`);
      return response.json() as Promise<{ data?: unknown }>;
    })
    .then((body) =>
      Array.isArray(body.data)
        ? body.data.map((raw) => readAudiusTrack(raw)).filter((t): t is Track => t !== null)
        : [],
    );
}

export function playlistTracks(id: string): Promise<Track[]> {
  return get(`/playlists/${encodeURIComponent(id)}/tracks`);
}

export function searchTracks(query: string, limit = 20): Promise<Track[]> {
  return get('/tracks/search', { query, sort_method: 'relevant', limit: String(limit) });
}

/** Popular tracks for a set of moods, mixed so no single mood dominates. */
export async function forMoods(moods: string[], perMood = 8): Promise<Track[]> {
  const lists = await Promise.all(
    moods.map((mood) =>
      get('/tracks/search', {
        query: '',
        mood,
        sort_method: 'popular',
        limit: String(perMood),
      }).catch(() => []),
    ),
  );
  const seen = new Set<string>();
  const mixed: Track[] = [];
  for (let i = 0; i < perMood; i++) {
    for (const list of lists) {
      const track = list[i];
      if (track && !seen.has(track.id)) {
        seen.add(track.id);
        mixed.push(track);
      }
    }
  }
  return mixed;
}
