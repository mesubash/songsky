import { titleFromFileName, trackIdFor } from './files';
import type { Track, TrackSource } from './types';

export interface ReadResult {
  track: Track;
  cover: { id: string; blob: Blob } | null;
}

/** Reads tags and cover art. music-metadata is loaded only when the first import starts. */
export async function readTrack(
  file: File,
  source: TrackSource,
  handle?: FileSystemFileHandle,
): Promise<ReadResult> {
  const { parseBlob, selectCover } = await import('music-metadata');
  const id = trackIdFor(file);

  let common: Awaited<ReturnType<typeof parseBlob>>['common'] | null = null;
  let duration = 0;
  try {
    const meta = await parseBlob(file, { skipPostHeaders: true });
    common = meta.common;
    duration = meta.format.duration ?? 0;
  } catch {
    // Unreadable tags: still import the file using its name.
  }

  const artist = common?.artist ?? common?.albumArtist ?? 'Unknown artist';
  const album = common?.album ?? '';
  const picture = selectCover(common?.picture);
  // Tracks from one album share a cover, so store it once.
  const coverId = picture ? (album ? `${common?.albumArtist ?? artist}|${album}` : id) : null;

  return {
    track: {
      id,
      title: common?.title ?? titleFromFileName(file.name),
      artist,
      album,
      trackNo: common?.trackNumber ?? null,
      duration,
      coverId,
      source,
      handle,
      addedAt: Date.now(),
    },
    cover:
      picture && coverId
        ? {
            id: coverId,
            blob: new Blob([picture.data as Uint8Array<ArrayBuffer>], { type: picture.format }),
          }
        : null,
  };
}
