import { describe, expect, it } from 'vitest';
import { captionFor, wrapLines } from './render';

/** 10 units per character, like a monospace font. */
const measure = (text: string) => text.length * 10;

describe('wrapLines', () => {
  it('keeps short text on one line', () => {
    expect(wrapLines(measure, 'Blue in Green', 200, 2)).toEqual(['Blue in Green']);
  });

  it('wraps at word boundaries', () => {
    expect(wrapLines(measure, 'one two three four', 90, 3)).toEqual(['one two', 'three', 'four']);
  });

  it('ends with an ellipsis when it runs out of lines', () => {
    const lines = wrapLines(measure, 'one two three four five', 90, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1]?.endsWith('…')).toBe(true);
    expect(measure(lines[1] ?? '')).toBeLessThanOrEqual(90);
  });

  it('cuts a single very long word', () => {
    const [line] = wrapLines(measure, 'Supercalifragilistic', 100, 1);
    expect(line?.endsWith('…')).toBe(true);
    expect(measure(line ?? '')).toBeLessThanOrEqual(100);
  });
});

describe('captionFor', () => {
  const date = new Date(2026, 10, 26);

  it('mentions the weather and time of day', () => {
    expect(captionFor('rain', 'night', date)).toBe('In the rain at night, 26 Nov 2026');
    expect(captionFor('clear', 'day', date)).toBe('Clear skies by day, 26 Nov 2026');
  });

  it('works without weather', () => {
    expect(captionFor(null, 'dusk', date)).toBe('Heard at dusk, 26 Nov 2026');
  });
});
