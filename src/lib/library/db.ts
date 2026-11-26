import { type DBSchema, type IDBPDatabase, openDB } from 'idb';
import type { PlayRecord, Track } from './types';

interface AttuneDB extends DBSchema {
  tracks: { key: string; value: Track };
  covers: { key: string; value: Blob };
  /** Copied audio for browsers without folder access. */
  files: { key: string; value: File };
  folders: { key: string; value: FileSystemDirectoryHandle };
  history: { key: number; value: PlayRecord; indexes: { byTrack: string } };
}

let connection: Promise<IDBPDatabase<AttuneDB>> | undefined;

export function db(): Promise<IDBPDatabase<AttuneDB>> {
  connection ??= openDB<AttuneDB>('attune', 1, {
    upgrade(database) {
      database.createObjectStore('tracks', { keyPath: 'id' });
      database.createObjectStore('covers');
      database.createObjectStore('files');
      database.createObjectStore('folders');
      database
        .createObjectStore('history', { autoIncrement: true })
        .createIndex('byTrack', 'trackId');
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
