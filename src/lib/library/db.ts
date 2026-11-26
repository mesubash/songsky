import { type DBSchema, type IDBPDatabase, openDB } from 'idb';
import type { Playlist, PlayRecord, Track } from './types';

interface SongskyDB extends DBSchema {
  tracks: { key: string; value: Track };
  covers: { key: string; value: Blob };
  /** Copied audio for browsers without folder access. */
  files: { key: string; value: File };
  folders: { key: string; value: FileSystemDirectoryHandle };
  history: { key: number; value: PlayRecord; indexes: { byTrack: string } };
  playlists: { key: string; value: Playlist };
}

let connection: Promise<IDBPDatabase<SongskyDB>> | undefined;

export function db(): Promise<IDBPDatabase<SongskyDB>> {
  connection ??= openDB<SongskyDB>('songsky', 2, {
    // Each step runs once, so existing databases keep their data when upgraded.
    upgrade(database, oldVersion) {
      if (oldVersion < 1) {
        database.createObjectStore('tracks', { keyPath: 'id' });
        database.createObjectStore('covers');
        database.createObjectStore('files');
        database.createObjectStore('folders');
        database
          .createObjectStore('history', { autoIncrement: true })
          .createIndex('byTrack', 'trackId');
      }
      if (oldVersion < 2) database.createObjectStore('playlists', { keyPath: 'id' });
    },
  });
  return connection;
}

export async function addPlay(record: PlayRecord): Promise<void> {
  await (await db()).add('history', record);
}

export async function allPlays(): Promise<PlayRecord[]> {
  return (await db()).getAll('history');
}

export async function allPlaylists(): Promise<Playlist[]> {
  return (await db()).getAll('playlists');
}

export async function putPlaylist(playlist: Playlist): Promise<void> {
  await (await db()).put('playlists', playlist);
}

export async function deletePlaylist(id: string): Promise<void> {
  await (await db()).delete('playlists', id);
}
