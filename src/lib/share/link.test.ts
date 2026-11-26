import { describe, expect, it } from 'vitest';
import { decodeShare, encodeShare, shareUrl } from './link';

describe('shared playlist links', () => {
  it('round-trips the name and online songs, dropping songs from a device', () => {
    const data = encodeShare({
      name: 'Rainy Kathmandu ☔',
      ids: ['audius:Ab12', 'local-file.mp3|123|456', 'jamendo:1896297'],
    });
    expect(data).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeShare(data)).toEqual({
      name: 'Rainy Kathmandu ☔',
      ids: ['audius:Ab12', 'jamendo:1896297'],
    });
  });

  it('rejects damaged or foreign links', () => {
    expect(decodeShare('not-base64!!')).toBeNull();
    expect(decodeShare(btoa(JSON.stringify({ n: 'x', t: ['javascript:alert(1)'] })))).toBeNull();
    expect(decodeShare(btoa('[]'))).toBeNull();
  });

  it('builds a link to the shared page', () => {
    expect(shareUrl({ name: 'Mix', ids: ['audius:a1'] }, 'https://songsky.test')).toMatch(
      /^https:\/\/songsky\.test\/#shared\/[A-Za-z0-9_-]+$/,
    );
  });
});
