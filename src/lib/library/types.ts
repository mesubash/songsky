/**
 * Where a track's audio lives.
 * - folder: a file handle from a picked folder (Chromium). Survives reloads.
 * - copy: the file was copied into IndexedDB (browsers without folder access, e.g. Safari).
 * - session: in memory only, because the copy failed (storage full). Gone after reload.
 * - stream: played from a music service (Audius) over the internet.
 */
export type TrackSource = 'folder' | 'copy' | 'session' | 'stream';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  trackNo: number | null;
  /** Seconds. 0 when the tags don't say; filled in on first play. */
  duration: number;
  coverId: string | null;
  source: TrackSource;
  handle?: FileSystemFileHandle;
  /** Stream tracks: where the audio and cover come from, and pages to credit the artist. */
  streamUrl?: string;
  artworkUrl?: string;
  link?: string;
  artistLink?: string;
  addedAt: number;
  /** Set once the song has been analysed, even if tempo or key couldn't be found. */
  analyzedAt?: number;
  bpm?: number;
  /** e.g. "A minor". */
  key?: string;
  /** DJ key code, e.g. "8A". */
  camelot?: string;
}

export interface PlayRecord {
  trackId: string;
  playedAt: number;
  /** Only when "Remember where I listen" is on. Rounded to about 11 km. */
  place?: { name: string; latitude: number; longitude: number };
  weather?: string;
  /** Streamed songs: a copy of the song's details, so history can show and replay it later. */
  stream?: Track;
}
