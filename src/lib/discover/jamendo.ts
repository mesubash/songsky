import type { Track } from '$lib/library/types';
import { API_BASE } from '$lib/native';
import { decodeEntities } from './audius';

/**
 * Jamendo: free Creative Commons music. Requests go through Songsky's own /api/jamendo,
 * which adds the key on the server, so no key is in this code.
 */
export const JAMENDO_PREFIX = 'jamendo:';

const text = (value: unknown, max = 200): string | null =>
  typeof value === 'string' && value.trim() ? decodeEntities(value.trim()).slice(0, max) : null;
const https = (value: unknown): string | undefined =>
  typeof value === 'string' && value.startsWith('https://') ? value : undefined;

/** Turns one Jamendo track into a Songsky track, or null if it can't be streamed. */
export function readJamendoTrack(raw: unknown, now = Date.now()): Track | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const t = raw as Record<string, unknown>;
  const id = text(String(t.id ?? ''), 40);
  const title = text(t.name);
  const artist = text(t.artist_name);
  const streamUrl = https(t.audio);
  if (!id || !title || !artist || !streamUrl) return null;
  const artistId = text(String(t.artist_id ?? ''), 40);
  return {
    id: `${JAMENDO_PREFIX}${id}`,
    title,
    artist,
    album: text(t.album_name) ?? '',
    trackNo: null,
    duration: typeof t.duration === 'number' && t.duration > 0 ? t.duration : 0,
    coverId: null,
    source: 'stream',
    streamUrl,
    artworkUrl: https(t.image) ?? https(t.album_image),
    link: https(t.shareurl),
    artistLink: artistId
      ? `https://www.jamendo.com/artist/${encodeURIComponent(artistId)}`
      : undefined,
    addedAt: now,
  };
}

export type JamendoOrder = 'popularity_week' | 'popularity_month' | 'popularity_total';

export async function jamendoTracks(
  {
    search,
    tags,
    ids,
    order = 'popularity_week',
  }: { search?: string; tags?: string; ids?: readonly string[]; order?: JamendoOrder },
  limit = 30,
): Promise<Track[]> {
  const params = new URLSearchParams({ order, limit: String(limit) });
  if (search) params.set('search', search);
  if (tags) params.set('tags', tags);
  if (ids?.length) params.set('ids', ids.join(','));
  const ask = async () => {
    const response = await fetch(`${API_BASE}/api/jamendo?${params}`);
    if (!response.ok) throw new Error(`Jamendo request failed: ${response.status}`);
    const body: { results?: unknown } = await response.json();
    if (!Array.isArray(body.results)) return [];
    return body.results.map((raw) => readJamendoTrack(raw)).filter((t): t is Track => t !== null);
  };
  // Jamendo now and then answers with nothing for a search that has results; ask again once.
  const tracks = await ask();
  return tracks.length ? tracks : ask();
}

/** True when Songsky's server has a Jamendo key, so the Jamendo tab can show. */
export async function jamendoAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/jamendo?limit=1`);
    // A host without the route may answer with the app's own page, so check for real results.
    if (!response.ok || !response.headers.get('content-type')?.includes('json')) return false;
    const body: { results?: unknown } = await response.json();
    return Array.isArray(body.results);
  } catch {
    return false;
  }
}
