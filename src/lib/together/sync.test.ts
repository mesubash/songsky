import { describe, expect, it } from 'vitest';
import {
  clockOffset,
  needsSeek,
  parseSession,
  randomId,
  readChat,
  readNowPlaying,
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
