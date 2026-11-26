import { describe, expect, it } from 'vitest';
import type { Playlist, Track } from '$lib/library/types';
import { backupFileName, makeBackup, parseBackup, planRestore } from './backup';

const song = (id: string, source: Track['source'] = 'stream'): Track => ({
  id,
  title: id,
  artist: 'A',
  album: '',
  trackNo: null,
  duration: 1,
  coverId: null,
  source,
  addedAt: 0,
});

const playlist = (id: string, updatedAt: number): Playlist => ({
  id,
  name: id,
  trackIds: ['audius:1'],
  createdAt: 0,
  updatedAt,
});

describe('backups', () => {
  it('round-trips, keeping only online songs and songsky settings', () => {
    const backup = makeBackup({
      songs: [song('audius:1'), song('file.mp3', 'copy')],
      playlists: [playlist('p1', 1)],
      plays: [{ trackId: 'audius:1', playedAt: 5 }],
      settings: { 'songsky:sound': '{"crossfade":4}' },
      now: new Date('2026-11-26T00:00:00Z'),
    });
    const text = JSON.stringify(backup);
    const parsed = parseBackup(text.replace('"settings":{', '"settings":{"other-site":"x",'));
    expect(parsed.songs.map((s) => s.id)).toEqual(['audius:1']);
    expect(parsed.playlists).toHaveLength(1);
    expect(parsed.settings).toEqual({ 'songsky:sound': '{"crossfade":4}' });
  });

  it('refuses files that are not Songsky backups, with a readable reason', () => {
    expect(() => parseBackup('hello')).toThrow('isn’t a Songsky backup');
    expect(() => parseBackup('{"app":"other"}')).toThrow('isn’t a Songsky backup');
    expect(() => parseBackup('{"app":"songsky","version":9}')).toThrow('newer Songsky');
  });

  it('plans a merge: new songs, newer playlists, plays not already there', () => {
    const backup = parseBackup(
      JSON.stringify(
        makeBackup({
          songs: [song('audius:1'), song('audius:2')],
          playlists: [playlist('old', 1), playlist('newer', 9), playlist('fresh', 1)],
          plays: [
            { trackId: 'audius:1', playedAt: 5 },
            { trackId: 'audius:2', playedAt: 6 },
          ],
          settings: {},
        }),
      ),
    );
    const plan = planRestore(backup, {
      songIds: new Set(['audius:1']),
      playlists: [playlist('old', 5), playlist('newer', 2)],
      plays: [{ trackId: 'audius:1', playedAt: 5 }],
    });
    expect(plan.songs.map((s) => s.id)).toEqual(['audius:2']);
    expect(plan.playlists.map((p) => p.id)).toEqual(['newer', 'fresh']);
    expect(plan.plays).toEqual([{ trackId: 'audius:2', playedAt: 6 }]);
  });

  it('names the file by date', () => {
    expect(backupFileName(new Date('2026-11-26T10:00:00Z'))).toBe('songsky-backup-2026-11-26.json');
  });
});
