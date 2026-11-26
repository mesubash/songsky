import { describe, expect, it } from 'vitest';
import { readStation } from './stations';

const raw = {
  stationuuid: 's1',
  name: ' Kathmandu FM ',
  url_resolved: 'https://stream.example.com/live',
  favicon: 'http://example.com/logo.png',
  tags: 'pop,nepali, news,extra',
  country: 'Nepal',
  bitrate: 128,
  lastcheckok: 1,
};

describe('readStation', () => {
  it('keeps https streams with tidy details', () => {
    expect(readStation(raw)).toEqual({
      id: 's1',
      name: 'Kathmandu FM',
      streamUrl: 'https://stream.example.com/live',
      logo: undefined,
      tags: ['pop', 'nepali', 'news'],
      country: 'Nepal',
      bitrate: 128,
      homepage: undefined,
    });
  });

  it('skips http streams and stations that failed their last check', () => {
    expect(readStation({ ...raw, url_resolved: 'http://stream.example.com/live' })).toBeNull();
    expect(readStation({ ...raw, lastcheckok: 0 })).toBeNull();
  });
});
