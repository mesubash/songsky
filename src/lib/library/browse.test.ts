import { describe, expect, it } from 'vitest';
import { browse } from './browse';
import type { Track } from './types';

const track = (title: string, artist: string, extra: Partial<Track> = {}): Track => ({
  id: title,
  title,
  artist,
  album: '',
  trackNo: null,
  duration: 0,
  coverId: null,
  source: 'copy',
  addedAt: 0,
  ...extra,
});

const tracks = [
  track('Halo', 'Beyoncé', { addedAt: 1, bpm: 80 }),
  track('Around the World', 'Daft Punk', { addedAt: 3, bpm: 121 }),
  track('One More Time', 'Daft Punk', { addedAt: 2 }),
];
const titles = (list: Track[]) => list.map((t) => t.title);

describe('browse', () => {
  it('finds every word in title, artist or album, ignoring case and accents', () => {
    expect(titles(browse(tracks, 'beyonce', 'artist'))).toEqual(['Halo']);
    expect(titles(browse(tracks, 'daft time', 'artist'))).toEqual(['One More Time']);
    expect(browse(tracks, 'nothing here', 'artist')).toEqual([]);
  });

  it('sorts by title, newest first, or tempo with unknown tempos last', () => {
    expect(titles(browse(tracks, '', 'title'))).toEqual([
      'Around the World',
      'Halo',
      'One More Time',
    ]);
    expect(titles(browse(tracks, '', 'added'))).toEqual([
      'Around the World',
      'One More Time',
      'Halo',
    ]);
    expect(titles(browse(tracks, '', 'tempo'))).toEqual([
      'Halo',
      'Around the World',
      'One More Time',
    ]);
  });

  it('keeps the library order by default', () => {
    expect(titles(browse(tracks, '', 'artist'))).toEqual(titles(tracks));
  });
});
