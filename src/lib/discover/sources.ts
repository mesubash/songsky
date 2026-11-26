import type { Track } from '$lib/library/types';
import { AUDIUS_PREFIX } from './audius';
import { JAMENDO_PREFIX } from './jamendo';

/** The service a streamed song comes from, for labels like "Open on Jamendo". */
export function sourceName(track: Pick<Track, 'id'>): 'Audius' | 'Jamendo' | null {
  if (track.id.startsWith(AUDIUS_PREFIX)) return 'Audius';
  if (track.id.startsWith(JAMENDO_PREFIX)) return 'Jamendo';
  return null;
}

/** Takes turns from each list (a1, b1, a2, b2, …), skipping repeats, so no source dominates. */
export function interleave<T extends { id: string }>(...lists: T[][]): T[] {
  const seen = new Set<string>();
  const mixed: T[] = [];
  const longest = Math.max(0, ...lists.map((list) => list.length));
  for (let i = 0; i < longest; i++) {
    for (const list of lists) {
      const item = list[i];
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        mixed.push(item);
      }
    }
  }
  return mixed;
}
