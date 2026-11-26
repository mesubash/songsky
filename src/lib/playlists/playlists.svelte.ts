import { allPlaylists, deletePlaylist, putPlaylist } from '$lib/library/db';
import type { Playlist } from '$lib/library/types';

/** "Playlist 3": the next free default name. */
export function nextName(names: readonly string[]): string {
  let n = names.length + 1;
  while (names.includes(`Playlist ${n}`)) n++;
  return `Playlist ${n}`;
}

/** Your playlists, newest first. Saved on this device. */
class Playlists {
  list = $state<Playlist[]>([]);

  async load(): Promise<void> {
    this.list = (await allPlaylists()).sort((a, b) => b.createdAt - a.createdAt);
  }

  byId(id: string): Playlist | undefined {
    return this.list.find((p) => p.id === id);
  }

  async create(trackIds: string[] = [], name?: string): Promise<Playlist> {
    const now = Date.now();
    const playlist: Playlist = {
      id: crypto.randomUUID(),
      name: name?.trim() || nextName(this.list.map((p) => p.name)),
      trackIds: [...new Set(trackIds)],
      createdAt: now,
      updatedAt: now,
    };
    this.list = [playlist, ...this.list];
    await putPlaylist(playlist);
    return playlist;
  }

  rename(id: string, name: string): Promise<void> {
    return this.#update(id, (p) => ({ ...p, name: name.trim() || p.name }));
  }

  /** Adds a song at the end. Returns false if it was already there. */
  async add(id: string, trackId: string): Promise<boolean> {
    if (this.byId(id)?.trackIds.includes(trackId)) return false;
    await this.#update(id, (p) => ({ ...p, trackIds: [...p.trackIds, trackId] }));
    return true;
  }

  remove(id: string, trackId: string): Promise<void> {
    return this.#update(id, (p) => ({ ...p, trackIds: p.trackIds.filter((t) => t !== trackId) }));
  }

  async delete(id: string): Promise<void> {
    this.list = this.list.filter((p) => p.id !== id);
    await deletePlaylist(id);
  }

  /** After the library is cleared (which also clears saved playlists). */
  forget(): void {
    this.list = [];
  }

  async #update(id: string, change: (playlist: Playlist) => Playlist): Promise<void> {
    const current = this.byId(id);
    if (!current) return;
    const next = { ...change($state.snapshot(current) as Playlist), updatedAt: Date.now() };
    this.list = this.list.map((p) => (p.id === id ? next : p));
    await putPlaylist(next);
  }
}

export const playlists = new Playlists();
