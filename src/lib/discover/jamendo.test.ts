import { describe, expect, it } from 'vitest';
import { readJamendoTrack } from './jamendo';

const raw = {
  id: '1532771',
  name: 'Rainy Window',
  duration: 201,
  artist_id: '3501',
  artist_name: 'Lo Sky',
  album_name: 'Weather',
  image: 'https://usercontent.jamendo.com/cover.jpg',
  audio: 'https://prod-1.storage.jamendo.com/?trackid=1532771&format=mp32',
  shareurl: 'https://www.jamendo.com/track/1532771',
};

describe('readJamendoTrack', () => {
  it('reads a streamable track', () => {
    expect(readJamendoTrack(raw, 5)).toEqual({
      id: 'jamendo:1532771',
      title: 'Rainy Window',
      artist: 'Lo Sky',
      album: 'Weather',
      trackNo: null,
      duration: 201,
      coverId: null,
      source: 'stream',
      streamUrl: 'https://prod-1.storage.jamendo.com/?trackid=1532771&format=mp32',
      artworkUrl: 'https://usercontent.jamendo.com/cover.jpg',
      link: 'https://www.jamendo.com/track/1532771',
      artistLink: 'https://www.jamendo.com/artist/3501',
      addedAt: 5,
    });
  });

  it('skips tracks without an https stream', () => {
    expect(readJamendoTrack({ ...raw, audio: '' })).toBeNull();
    expect(readJamendoTrack({ ...raw, audio: 'http://example.com/a.mp3' })).toBeNull();
  });
});
