import { SvelteMap } from 'svelte/reactivity';
import { toast } from '$lib/toast.svelte';
import { db } from './db';
import { canPickFolder, isAbortError, isAudioFile, pickFiles, walkDirectory } from './files';
import { type ReadResult, readTrack } from './metadata';
import type { Track } from './types';

export interface ImportProgress {
  done: number;
  total: number;
}

function compareTracks(a: Track, b: Track): number {
  return (
    a.artist.localeCompare(b.artist) ||
    a.album.localeCompare(b.album) ||
    (a.trackNo ?? 0) - (b.trackNo ?? 0) ||
    a.title.localeCompare(b.title)
  );
}

class Library {
  tracks = $state<Track[]>([]);
  progress = $state<ImportProgress | null>(null);
  readonly canPickFolder = canPickFolder;

  /** Streamed songs shown in Discover but not saved, so the player can still find them. */
  #streams = new SvelteMap<string, Track>();

  /** Every known track: the library plus streamed songs seen in Discover. */
  byId = $derived(
    new Map([...this.#streams, ...this.tracks.map((track): [string, Track] => [track.id, track])]),
  );
  totalDuration = $derived(this.tracks.reduce((sum, track) => sum + track.duration, 0));

  /** Files that only live in memory this session (source: 'session'). */
  #sessionFiles = new SvelteMap<string, File>();
  #folders: FileSystemDirectoryHandle[] = [];
  #coverIds = new Set<string>();
  #coverUrls = new Map<string, Promise<string | null>>();

  async load(): Promise<void> {
    const database = await db();
    const [tracks, folders, coverIds] = await Promise.all([
      database.getAll('tracks'),
      database.getAll('folders'),
      database.getAllKeys('covers'),
    ]);
    this.#folders = folders;
    this.#coverIds = new Set(coverIds);
    // Session-only tracks lost their audio on reload; drop them.
    this.tracks = tracks.filter((track) => track.source !== 'session').sort(compareTracks);
  }

  /** Makes streamed songs known to the player without adding them to the library. */
  rememberStreams(tracks: readonly Track[]): void {
    for (const track of tracks) this.#streams.set(track.id, track);
    // ponytail: keep the newest 500; plenty for a browsing session.
    for (const id of [...this.#streams.keys()].slice(0, Math.max(0, this.#streams.size - 500))) {
      this.#streams.delete(id);
    }
  }

  isSaved(id: string): boolean {
    return this.tracks.some((track) => track.id === id);
  }

  /** Adds a streamed song to the library so it stays after Discover moves on. */
  async save(track: Track): Promise<void> {
    if (this.isSaved(track.id)) return;
    const saved = { ...($state.snapshot(track) as Track), addedAt: Date.now() };
    this.tracks = [...this.tracks, saved].sort(compareTracks);
    await (await db()).put('tracks', saved);
    toast.show(`Saved “${track.title}” to your library.`);
  }

  async remove(id: string): Promise<void> {
    const track = this.byId.get(id);
    this.tracks = this.tracks.filter((t) => t.id !== id);
    await (await db()).delete('tracks', id);
    if (track) toast.show(`Removed “${track.title}” from your library.`);
  }

  /** What the player loads: a file from this device, or a stream address. */
  async sourceFor(track: Track): Promise<Blob | string | null> {
    if (track.source === 'stream') return track.streamUrl ?? null;
    return this.fileFor(track);
  }

  isAvailable(track: Track): boolean {
    return track.source !== 'session' || this.#sessionFiles.has(track.id);
  }

  async addFolder(): Promise<void> {
    let dir: FileSystemDirectoryHandle;
    try {
      dir = await window.showDirectoryPicker({ id: 'songsky-music', mode: 'read' });
    } catch (error) {
      if (isAbortError(error)) return;
      throw error;
    }

    this.progress = { done: 0, total: 0 };
    const handles: FileSystemFileHandle[] = [];
    for await (const handle of walkDirectory(dir)) {
      handles.push(handle);
      this.progress.total = handles.length;
    }

    await (await db()).put('folders', dir, dir.name);
    this.#folders.push(dir);
    await this.#import(handles.map((handle) => ({ handle })));
  }

  async addFiles(files?: File[]): Promise<void> {
    const chosen = files ?? (await pickFiles());
    const picked = chosen.filter((file) => isAudioFile(file.name));
    if (chosen.length > 0 && picked.length === 0) {
      toast.show(
        'Those files aren’t songs Songsky can play. Choose MP3, M4A, FLAC, WAV or OGG files.',
      );
      return;
    }
    if (picked.length === 0) return;
    void navigator.storage?.persist?.();
    await this.#import(picked.map((file) => ({ file })));
  }

  async #import(items: { file?: File; handle?: FileSystemFileHandle }[]): Promise<void> {
    toast.clear();
    this.progress = { done: 0, total: items.length };
    const database = await db();
    const results: ReadResult[] = [];
    let copyFailed = false;

    // ponytail: sequential parsing; tags are read from headers only so it stays quick.
    // Add a small worker pool if large libraries feel slow.
    for (const item of items) {
      try {
        const file = item.file ?? (await item.handle?.getFile());
        if (!file) continue;
        const result = await readTrack(file, item.handle ? 'folder' : 'copy', item.handle);
        const { track } = result;

        if (!this.byId.has(track.id) && !results.some((r) => r.track.id === track.id)) {
          if (track.source === 'copy') {
            try {
              await database.put('files', file, track.id);
            } catch {
              copyFailed = true;
              track.source = 'session';
              this.#sessionFiles.set(track.id, file);
            }
          }
          results.push(result);
        }
      } catch {
        // Skip files that can't be read at all.
      } finally {
        if (this.progress) this.progress.done++;
      }
    }

    const tx = database.transaction(['tracks', 'covers'], 'readwrite');
    for (const { track, cover } of results) {
      void tx.objectStore('tracks').put(track);
      if (cover && !this.#coverIds.has(cover.id)) {
        this.#coverIds.add(cover.id);
        void tx.objectStore('covers').put(cover.blob, cover.id);
      }
    }
    await tx.done;

    this.tracks = [...this.tracks, ...results.map((r) => r.track)].sort(compareTracks);
    this.progress = null;
    toast.show(
      copyFailed
        ? 'Storage is full, so some songs will only play until you close Songsky.'
        : `Added ${results.length} ${results.length === 1 ? 'song' : 'songs'}.`,
    );
  }

  /** Returns the audio for a track, asking for folder access again if the browser needs it. */
  async fileFor(track: Track): Promise<File | null> {
    try {
      if (track.source === 'session') return this.#sessionFiles.get(track.id) ?? null;
      if (track.source === 'stream') {
        // Downloads the whole song; used only for analysing saved streams.
        if (!track.streamUrl) return null;
        const response = await fetch(track.streamUrl);
        return response.ok ? new File([await response.blob()], track.title) : null;
      }
      if (track.source === 'copy') return (await (await db()).get('files', track.id)) ?? null;
      if (!track.handle) return null;
      if ((await track.handle.queryPermission({ mode: 'read' })) !== 'granted') {
        // Granting the folder covers every file inside it, so the user is asked once.
        for (const folder of this.#folders) {
          if ((await folder.queryPermission({ mode: 'read' })) !== 'granted') {
            await folder.requestPermission({ mode: 'read' });
          }
        }
      }
      return await track.handle.getFile();
    } catch {
      return null;
    }
  }

  coverUrl(coverId: string): Promise<string | null> {
    let url = this.#coverUrls.get(coverId);
    if (!url) {
      url = db()
        .then((database) => database.get('covers', coverId))
        .then((blob) => (blob ? URL.createObjectURL(blob) : null));
      this.#coverUrls.set(coverId, url);
    }
    return url;
  }

  /** Fills in a duration the tags didn't have, once the audio reports it. */
  async setDuration(id: string, duration: number): Promise<void> {
    const track = this.byId.get(id);
    if (!track || track.duration > 0 || !Number.isFinite(duration)) return;
    track.duration = duration;
    await (await db()).put('tracks', $state.snapshot(track) as Track);
  }

  /** Saves tempo and key results onto a track. */
  async setAnalysis(id: string, result: Pick<Track, 'bpm' | 'key' | 'camelot'>): Promise<void> {
    const track = this.byId.get(id);
    if (!track) return;
    Object.assign(track, result, { analyzedAt: Date.now() });
    await (await db()).put('tracks', $state.snapshot(track) as Track);
  }

  async clear(): Promise<void> {
    const database = await db();
    const stores = ['tracks', 'covers', 'files', 'folders', 'history', 'playlists'] as const;
    await Promise.all(stores.map((store) => database.clear(store)));
    for (const url of this.#coverUrls.values()) void url.then((u) => u && URL.revokeObjectURL(u));
    this.#coverUrls.clear();
    this.#coverIds.clear();
    this.#sessionFiles.clear();
    this.#folders = [];
    this.tracks = [];
    toast.clear();
  }
}

export const library = new Library();
