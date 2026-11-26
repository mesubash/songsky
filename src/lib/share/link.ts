/**
 * A playlist shared by link: its name and the ids of its online songs, packed into the
 * address (#shared/…). Nothing is stored anywhere; the other person's Songsky looks the
 * songs up again from Audius and Jamendo. Songs from someone's device can't be shared.
 */
export interface SharedPlaylist {
  name: string;
  ids: string[];
}

const MAX_SONGS = 100;
const SONG_ID = /^(audius|jamendo):[A-Za-z0-9]{1,40}$/;

/** Online songs only (Audius and Jamendo), since files on a device can't be shared. */
export const isShareable = (id: string): boolean => SONG_ID.test(id);

const toBase64Url = (text: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');

const fromBase64Url = (text: string) =>
  new TextDecoder().decode(
    Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), (c) => c.charCodeAt(0)),
  );

export function encodeShare(playlist: SharedPlaylist): string {
  const ids = playlist.ids.filter(isShareable).slice(0, MAX_SONGS);
  return toBase64Url(JSON.stringify({ n: playlist.name.slice(0, 80), t: ids }));
}

/** Reads a shared playlist from a link, or null if the link is damaged or not one of ours. */
export function decodeShare(data: string): SharedPlaylist | null {
  try {
    const raw: unknown = JSON.parse(fromBase64Url(data));
    if (typeof raw !== 'object' || raw === null) return null;
    const { n, t } = raw as { n?: unknown; t?: unknown };
    if (typeof n !== 'string' || !Array.isArray(t)) return null;
    const ids = t.filter((id): id is string => typeof id === 'string' && isShareable(id));
    if (!ids.length) return null;
    return { name: n.trim().slice(0, 80) || 'Shared playlist', ids: ids.slice(0, MAX_SONGS) };
  } catch {
    return null;
  }
}

export const shareUrl = (playlist: SharedPlaylist, origin = location.origin): string =>
  `${origin}/#shared/${encodeShare(playlist)}`;
