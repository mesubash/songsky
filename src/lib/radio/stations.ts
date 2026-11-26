/**
 * Radio Browser: a free, community-run directory of internet radio stations. No key is
 * needed. Only https streams are kept, since an https page can't play http audio.
 */
const SERVERS = ['https://de1.api.radio-browser.info', 'https://fi1.api.radio-browser.info'];

export interface Station {
  id: string;
  name: string;
  streamUrl: string;
  /** The station's logo, when it has an https one. */
  logo?: string;
  tags: string[];
  country: string;
  bitrate: number;
  homepage?: string;
}

/** Turns one directory entry into a Station, or null if it can't be played here. */
export function readStation(raw: unknown): Station | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const s = raw as Record<string, unknown>;
  const id = typeof s.stationuuid === 'string' ? s.stationuuid : null;
  const name = typeof s.name === 'string' ? s.name.trim().slice(0, 120) : '';
  const url = typeof s.url_resolved === 'string' ? s.url_resolved.trim() : '';
  if (!id || !name || !url.startsWith('https://') || s.lastcheckok === 0) return null;
  const https = (value: unknown) =>
    typeof value === 'string' && value.startsWith('https://') ? value : undefined;
  return {
    id,
    name,
    streamUrl: url,
    logo: https(s.favicon),
    tags:
      typeof s.tags === 'string'
        ? s.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 3)
        : [],
    country: typeof s.country === 'string' ? s.country : '',
    bitrate: typeof s.bitrate === 'number' ? s.bitrate : 0,
    homepage: https(s.homepage),
  };
}

/** Popular working stations for a style ("jazz") or a name search. */
export async function findStations(
  { tag, name }: { tag?: string; name?: string },
  limit = 40,
): Promise<Station[]> {
  const params = new URLSearchParams({
    hidebroken: 'true',
    is_https: 'true',
    order: 'clickcount',
    reverse: 'true',
    limit: String(limit),
  });
  if (tag) params.set('tag', tag);
  if (name) params.set('name', name);
  let lastError: unknown;
  for (const server of SERVERS) {
    try {
      const response = await fetch(`${server}/json/stations/search?${params}`);
      if (!response.ok) throw new Error(`Radio request failed: ${response.status}`);
      const body: unknown = await response.json();
      if (!Array.isArray(body)) return [];
      const seen = new Set<string>();
      // The directory often lists the same stream twice; keep the first.
      return body
        .map(readStation)
        .filter(
          (s): s is Station => s !== null && !seen.has(s.streamUrl) && !!seen.add(s.streamUrl),
        );
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
