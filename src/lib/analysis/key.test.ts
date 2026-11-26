import { describe, expect, it } from 'vitest';
import { camelot, detectKey, fft, keyName, parseKeyName } from './key';

const RATE = 11025;

/** A few seconds of each chord in turn, built from pure tones (MIDI note numbers). */
function progression(chords: number[][], secondsEach = 2): Float32Array {
  const perChord = RATE * secondsEach;
  const out = new Float32Array(perChord * chords.length);
  chords.forEach((notes, c) => {
    for (let i = 0; i < perChord; i++) {
      let v = 0;
      for (const midi of notes)
        v += Math.sin((2 * Math.PI * 440 * 2 ** ((midi - 69) / 12) * i) / RATE);
      out[c * perChord + i] = v / notes.length;
    }
  });
  return out;
}

describe('fft', () => {
  it('finds a pure tone in the right bin', () => {
    const n = 64;
    const re = Float64Array.from({ length: n }, (_, i) => Math.cos((2 * Math.PI * 5 * i) / n));
    const im = new Float64Array(n);
    fft(re, im);
    const mags = Array.from(re, (r, i) => Math.hypot(r, im[i] ?? 0));
    expect(mags.indexOf(Math.max(...mags.slice(0, n / 2)))).toBe(5);
  });
});

describe('detectKey', () => {
  it('hears C major in a I–IV–V–I progression', () => {
    // C E G, F A C, G B D, C E G
    const signal = progression([
      [60, 64, 67],
      [65, 69, 72],
      [67, 71, 74],
      [60, 64, 67],
    ]);
    expect(keyName(detectKey(signal, RATE))).toBe('C major');
  });

  it('hears A minor in an i–iv–v–i progression', () => {
    // A C E, D F A, E G B, A C E
    const signal = progression([
      [57, 60, 64],
      [62, 65, 69],
      [64, 67, 71],
      [57, 60, 64],
    ]);
    expect(keyName(detectKey(signal, RATE))).toBe('A minor');
  });
});

describe('camelot', () => {
  it.each([
    [{ tonic: 0, mode: 'major' }, '8B'],
    [{ tonic: 7, mode: 'major' }, '9B'],
    [{ tonic: 5, mode: 'major' }, '7B'],
    [{ tonic: 11, mode: 'major' }, '1B'],
    [{ tonic: 9, mode: 'minor' }, '8A'],
    [{ tonic: 4, mode: 'minor' }, '9A'],
    [{ tonic: 0, mode: 'minor' }, '5A'],
  ] as const)('%o → %s', (key, code) => expect(camelot(key)).toBe(code));
});

describe('parseKeyName', () => {
  it.each([
    ['A flat minor', 8, 'minor'],
    ['C major', 0, 'major'],
    ['F sharp major', 6, 'major'],
    ['B♭ minor', 10, 'minor'],
    ['Eb major', 3, 'major'],
    ['g# min', 8, 'minor'],
  ])('%s', (name, tonic, mode) => expect(parseKeyName(name)).toEqual({ tonic, mode }));

  it('rejects anything else', () => {
    expect(parseKeyName('')).toBeNull();
    expect(parseKeyName('H major')).toBeNull();
    expect(parseKeyName('C')).toBeNull();
  });
});
