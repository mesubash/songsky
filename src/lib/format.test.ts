import { describe, expect, it } from 'vitest';
import { formatLength, formatTime } from './format';

describe('formatTime', () => {
  it.each([
    [0, '0:00'],
    [9.7, '0:09'],
    [75, '1:15'],
    [3725, '1:02:05'],
    [Number.NaN, '0:00'],
    [-5, '0:00'],
  ])('%s → %s', (input, output) => expect(formatTime(input)).toBe(output));
});

describe('formatLength', () => {
  it.each([
    [0, '0 min'],
    [2520, '42 min'],
    [11100, '3 h 5 min'],
  ])('%s → %s', (input, output) => expect(formatLength(input)).toBe(output));
});
