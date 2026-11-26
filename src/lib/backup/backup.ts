import type { Playlist, PlayRecord, Track } from '$lib/library/types';

/**
 * A backup file: everything about a listener's Songsky except the audio of their own files.
 * Saved online songs come back fully; songs from a device keep their place in playlists and
 * history, and play again once the same files are added on the new device.
 */
export interface Backup {
  app: 'songsky';
  version: 1;
  exportedAt: string;
  songs: Track[];
  playlists: Playlist[];
  plays: PlayRecord[];
  settings: Record<string, string>;
}

/** Settings live in localStorage under this prefix. */
export const SETTINGS_PREFIX = 'songsky:';

/** Drops what can't be written to a file (folder handles) and what belongs to the device. */
const portable = (track: Track): Track => {
  const { handle: _handle, ...rest } = track;
  return rest;
};

export function makeBackup(data: {
  songs: readonly Track[];
  playlists: readonly Playlist[];
  plays: readonly PlayRecord[];
  settings: Record<string, string>;
  now?: Date;
}): Backup {
  return {
    app: 'songsky',
    version: 1,
    exportedAt: (data.now ?? new Date()).toISOString(),
    songs: data.songs.map(portable),
    playlists: [...data.playlists],
    plays: [...data.plays],
    settings: data.settings,
  };
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isSong = (value: unknown): value is Track =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  typeof value.artist === 'string' &&
  typeof value.source === 'string';

const isPlaylist = (value: unknown): value is Playlist =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  Array.isArray(value.trackIds) &&
  value.trackIds.every((id) => typeof id === 'string');

const isPlay = (value: unknown): value is PlayRecord =>
  isObject(value) && typeof value.trackId === 'string' && typeof value.playedAt === 'number';

/** Reads a backup file, or throws an error whose message can be shown as is. */
export function parseBackup(text: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('That file isn’t a Songsky backup.');
  }
  if (!isObject(raw) || raw.app !== 'songsky') throw new Error('That file isn’t a Songsky backup.');
  if (raw.version !== 1)
    throw new Error('This backup is from a newer Songsky. Update Songsky first.');
  const list = (value: unknown) => (Array.isArray(value) ? value : []);
  const settings: Record<string, string> = {};
  if (isObject(raw.settings)) {
    for (const [key, value] of Object.entries(raw.settings)) {
      if (key.startsWith(SETTINGS_PREFIX) && typeof value === 'string') settings[key] = value;
    }
  }
  return {
    app: 'songsky',
    version: 1,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
    // Only online songs can be restored as songs; device files need the files themselves.
    songs: list(raw.songs)
      .filter(isSong)
      .filter((s) => s.source === 'stream'),
    playlists: list(raw.playlists).filter(isPlaylist),
    plays: list(raw.plays).filter(isPlay),
    settings,
  };
}

/** What restoring adds: new online songs, new or newer playlists, plays not already there. */
export function planRestore(
  backup: Backup,
  current: {
    songIds: ReadonlySet<string>;
    playlists: readonly Playlist[];
    plays: readonly PlayRecord[];
  },
): { songs: Track[]; playlists: Playlist[]; plays: PlayRecord[] } {
  const playKey = (p: PlayRecord) => `${p.trackId}@${p.playedAt}`;
  const havePlays = new Set(current.plays.map(playKey));
  const havePlaylists = new Map(current.playlists.map((p) => [p.id, p]));
  return {
    songs: backup.songs.filter((s) => !current.songIds.has(s.id)),
    playlists: backup.playlists.filter((p) => {
      const mine = havePlaylists.get(p.id);
      return !mine || (p.updatedAt ?? 0) > (mine.updatedAt ?? 0);
    }),
    plays: backup.plays.filter((p) => !havePlays.has(playKey(p))),
  };
}

export const backupFileName = (now = new Date()) =>
  `songsky-backup-${now.toISOString().slice(0, 10)}.json`;
