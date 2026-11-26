import { describe, expect, it } from 'vitest';
import { audiusStreamUrl, isAudiusStreamUrl, readAudiusTrack } from './audius';

const raw = {
  id: 'mRaOxp1',
  title: 'Beneath the Lily',
  duration: 188,
  bpm: 124.4,
  musical_key: 'A flat minor',
  permalink: '/parasox/beneath-the-lily',
  artwork: { '480x480': 'https://example.audius.co/art/480x480.jpg' },
  is_streamable: true,
  is_stream_gated: false,
  user: { name: 'parasox', handle: 'parasox' },
};

describe('readAudiusTrack', () => {
  it('turns an API track into a playable stream track with tempo and key', () => {
    const track = readAudiusTrack(raw, 1000);
    expect(track).toMatchObject({
      id: 'audius:mRaOxp1',
      title: 'Beneath the Lily',
      artist: 'parasox',
      duration: 188,
      source: 'stream',
      streamUrl: audiusStreamUrl('mRaOxp1'),
      artworkUrl: 'https://example.audius.co/art/480x480.jpg',
      link: 'https://audius.co/parasox/beneath-the-lily',
      artistLink: 'https://audius.co/parasox',
      bpm: 124,
      key: 'A♭ minor',
      camelot: '1A',
      analyzedAt: 1000,
    });
  });

  it('skips paywalled, deleted or broken tracks', () => {
    expect(readAudiusTrack({ ...raw, is_stream_gated: true })).toBeNull();
    expect(readAudiusTrack({ ...raw, is_streamable: false })).toBeNull();
    expect(readAudiusTrack({ ...raw, title: '' })).toBeNull();
    expect(readAudiusTrack('nope')).toBeNull();
  });

  it('ignores unsafe artwork and unknown keys', () => {
    const track = readAudiusTrack({
      ...raw,
      artwork: { '480x480': 'javascript:alert(1)' },
      musical_key: 'weird',
    });
    expect(track?.artworkUrl).toBeUndefined();
    expect(track?.camelot).toBeUndefined();
    expect(track?.analyzedAt).toBeUndefined();
  });
});

describe('isAudiusStreamUrl', () => {
  it('accepts only Audius stream links', () => {
    expect(isAudiusStreamUrl(audiusStreamUrl('abc'))).toBe(true);
    expect(isAudiusStreamUrl('https://evil.example/v1/tracks/abc/stream')).toBe(false);
    expect(isAudiusStreamUrl('https://api.audius.co/v1/users/abc')).toBe(false);
    expect(isAudiusStreamUrl('not a url')).toBe(false);
  });
});
