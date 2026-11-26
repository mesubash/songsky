import { describe, expect, it } from 'vitest';
import { cleanTitle, currentLine, parseLrc } from './lyrics';

describe('lyrics', () => {
  it('reads synced lines in time order, including lines with two timestamps', () => {
    const lines = parseLrc(
      '[00:16.46] You lift my heart up\n[ar: Disclosure]\n[01:02.5][00:20.00] Chorus\nno time',
    );
    expect(lines).toEqual([
      { time: 16.46, text: 'You lift my heart up' },
      { time: 20, text: 'Chorus' },
      { time: 62.5, text: 'Chorus' },
    ]);
  });

  it('finds the line being sung', () => {
    const lines = parseLrc('[00:05.00] a\n[00:10.00] b\n[00:15.00] c');
    expect(currentLine(lines, 2)).toBe(-1);
    expect(currentLine(lines, 10)).toBe(1);
    expect(currentLine(lines, 99)).toBe(2);
  });

  it('cleans streaming titles down to the song and its singer', () => {
    expect(
      cleanTitle('Kate Bush - Running Up That Hill (Lookas Remix)(Stranger Things)', 'Lookas'),
    ).toEqual({
      title: 'Running Up That Hill',
      artist: 'Kate Bush',
    });
    expect(cleanTitle('Jenny - Steve Aoki & 3LAU', 'Steve Aoki')).toEqual({
      title: 'Jenny',
      artist: 'Steve Aoki',
    });
    expect(cleanTitle('Latch feat. Sam Smith [Official]', 'Disclosure')).toEqual({
      title: 'Latch',
      artist: 'Disclosure',
    });
  });
});
