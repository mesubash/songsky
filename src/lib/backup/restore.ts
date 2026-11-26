import { db } from '$lib/library/db';
import { library } from '$lib/library/library.svelte';
import type { Playlist, Track } from '$lib/library/types';
import { memory } from '$lib/memory/memory.svelte';
import { playlists } from '$lib/playlists/playlists.svelte';
import { type Backup, backupFileName, makeBackup, planRestore, SETTINGS_PREFIX } from './backup';

/** Saves everything (except the audio of device files) to a file in the downloads folder. */
export function downloadBackup(): void {
  const settings: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = key ? localStorage.getItem(key) : null;
    if (key?.startsWith(SETTINGS_PREFIX) && value !== null) settings[key] = value;
  }
  const backup = makeBackup({
    songs: $state.snapshot(library.tracks) as Track[],
    playlists: $state.snapshot(playlists.list) as Playlist[],
    plays: $state.snapshot(memory.plays),
    settings,
  });
  const file = new Blob([JSON.stringify(backup)], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = backupFileName();
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** What a backup would add here, for the confirmation message. */
export function previewRestore(backup: Backup) {
  return planRestore(backup, {
    songIds: new Set(library.tracks.map((t) => t.id)),
    playlists: playlists.list,
    plays: memory.plays,
  });
}

/**
 * Merges a backup into this device: adds its online songs, new or newer playlists and plays
 * that aren't here yet, and takes its settings. Nothing here is deleted. The page reloads
 * afterwards so every part of Songsky starts from the restored data.
 */
export async function restoreBackup(backup: Backup): Promise<void> {
  const plan = previewRestore(backup);
  const database = await db();
  const tx = database.transaction(['tracks', 'playlists', 'history'], 'readwrite');
  for (const song of plan.songs) void tx.objectStore('tracks').put(song);
  for (const playlist of plan.playlists) void tx.objectStore('playlists').put(playlist);
  for (const play of plan.plays) void tx.objectStore('history').add(play);
  await tx.done;
  for (const [key, value] of Object.entries(backup.settings)) localStorage.setItem(key, value);
  location.reload();
}
