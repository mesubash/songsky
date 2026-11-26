import { describe, expect, it } from 'vitest';
import {
  addVote,
  clockOffset,
  needsSeek,
  parseSession,
  randomId,
  readCatalog,
  readChat,
  readNowPlaying,
  readRequests,
  searchCatalog,
  sessionLink,
  targetPosition,
} from './sync';

describe('session links', () => {
  const session = { room: randomId(10), password: randomId(20) };

  it('round-trips through a link and drops the old hash', () => {
    const link = sessionLink('https://example.com/attune/#memories', session);
    expect(link.startsWith('https://example.com/attune/?room=')).toBe(true);
    expect(parseSession(link)).toEqual(session);
  });

  it('rejects links that aren’t invites', () => {
    expect(parseSession('https://example.com/')).toBeNull();
    expect(parseSession('https://example.com/?room=short&key=x')).toBeNull();
    expect(
      parseSession(`https://example.com/?room=${'A'.repeat(10)}&key=${'b'.repeat(20)}`),
    ).toBeNull();
  });
});

describe('message checks', () => {
  it('accepts a well-formed now-playing message', () => {
    const state = { key: 'song', playing: true, position: 12.5, at: 1000 };
    expect(readNowPlaying(state)).toEqual(state);
  });

  it.each([
    null,
    'x',
    { key: 1 },
    { key: 's', playing: 'yes', position: 1, at: 1 },
    { key: 's', playing: true, position: -1, at: 1 },
  ])('rejects %o', (bad) => expect(readNowPlaying(bad)).toBeNull());

  it('trims and caps chat, and drops empty messages', () => {
    const long = 'x'.repeat(1000);
    expect(readChat({ name: '  Ram ', text: long, at: 1 })).toEqual({
      name: 'Ram',
      text: 'x'.repeat(300),
      at: 1,
    });
    expect(readChat({ name: '', text: 'hi', at: 1 })?.name).toBe('Listener');
    expect(readChat({ name: 'a', text: '   ', at: 1 })).toBeNull();
    expect(readChat({ name: 'a', text: 5, at: 1 })).toBeNull();
  });
});

describe('sync maths', () => {
  it('uses the fastest round trip for the clock offset', () => {
    const offset = clockOffset([
      { sent: 0, host: 5000, received: 400 },
      { sent: 1000, host: 6060, received: 1100 },
    ]);
    expect(offset).toBe(5010);
  });

  it('moves the target forward while playing and holds it while paused', () => {
    const state = { key: 's', playing: true, position: 10, at: 5000 };
    expect(targetPosition(state, 1000, 5000)).toBeCloseTo(11);
    expect(targetPosition({ ...state, playing: false }, 9999, 5000)).toBe(10);
  });

  it('only seeks when drift is noticeable', () => {
    expect(needsSeek(10, 10.2)).toBe(false);
    expect(needsSeek(10, 10.5)).toBe(true);
  });
});

describe('song requests', () => {
  const a = { key: 'a', title: 'Alpha', artist: 'Band' };
  const b = { key: 'b', title: 'Beta', artist: 'Other' };

  it('counts one vote per person and puts the most wanted first', () => {
    let requests = addVote([], a, 'p1', 1);
    requests = addVote(requests, b, 'p1', 2);
    requests = addVote(requests, b, 'p2', 3);
    requests = addVote(requests, b, 'p2', 4);
    expect(requests.map((r) => [r.key, r.votes.length])).toEqual([
      ['b', 2],
      ['a', 1],
    ]);
  });

  it('keeps first-come order on a tie', () => {
    const requests = addVote(addVote([], b, 'p1', 2), a, 'p2', 1);
    expect(requests.map((r) => r.key)).toEqual(['a', 'b']);
  });

  it('checks requests and catalogs from other devices', () => {
    expect(readRequests([{ ...a, votes: ['p1', 7], at: 1 }, { key: 1 }, 'x'])).toEqual([
      { ...a, votes: ['p1'], at: 1 },
    ]);
    expect(readCatalog([a, { title: 'no key' }])).toEqual([a]);
    expect(readCatalog('nope')).toEqual([]);
  });

  it('searches title and artist with every word', () => {
    expect(searchCatalog([a, b], 'alp band').map((s) => s.key)).toEqual(['a']);
    expect(searchCatalog([a, b], '  ')).toEqual([]);
  });
});
