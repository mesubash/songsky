/**
 * Musical key detection: build a pitch-class profile (how much of each of the 12 notes
 * the song contains) and compare it with Krumhansl–Kessler key profiles for all 24 keys.
 */

const FRAME = 4096;
const MIN_HZ = 65; // C2: below this, bass rumble smears the notes.
const MAX_HZ = 2000;

const NOTES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'] as const;

// How strongly each scale degree is felt in major and minor keys (Krumhansl & Kessler, 1982).
const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

export type Mode = 'major' | 'minor';

export interface Key {
  /** Pitch class of the tonic, 0 = C … 11 = B. */
  tonic: number;
  mode: Mode;
}

/** In-place iterative radix-2 FFT. `re` and `im` must have a power-of-two length. */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j] as number, re[i] as number];
      [im[i], im[j]] = [im[j] as number, im[i] as number];
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const angle = (-2 * Math.PI) / size;
    for (let start = 0; start < n; start += size) {
      for (let k = 0; k < size / 2; k++) {
        const cos = Math.cos(angle * k);
        const sin = Math.sin(angle * k);
        const a = start + k;
        const b = a + size / 2;
        const tr = (re[b] as number) * cos - (im[b] as number) * sin;
        const ti = (re[b] as number) * sin + (im[b] as number) * cos;
        re[b] = (re[a] as number) - tr;
        im[b] = (im[a] as number) - ti;
        re[a] = (re[a] as number) + tr;
        im[a] = (im[a] as number) + ti;
      }
    }
  }
}

/** How much of each pitch class (C … B) the signal contains, summing to 1. */
export function chroma(samples: Float32Array, sampleRate: number): number[] {
  const profile = new Array<number>(12).fill(0);
  const window = Float64Array.from(
    { length: FRAME },
    (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / FRAME),
  );
  const pitchClassOfBin = Array.from({ length: FRAME / 2 }, (_, bin) => {
    const hz = (bin * sampleRate) / FRAME;
    if (hz < MIN_HZ || hz > MAX_HZ) return -1;
    const midi = Math.round(69 + 12 * Math.log2(hz / 440));
    return ((midi % 12) + 12) % 12;
  });

  const re = new Float64Array(FRAME);
  const im = new Float64Array(FRAME);
  for (let start = 0; start + FRAME <= samples.length; start += FRAME / 2) {
    for (let i = 0; i < FRAME; i++) {
      re[i] = (samples[start + i] ?? 0) * (window[i] ?? 0);
      im[i] = 0;
    }
    fft(re, im);
    for (let bin = 1; bin < FRAME / 2; bin++) {
      const pc = pitchClassOfBin[bin] ?? -1;
      if (pc < 0) continue;
      // Square root of magnitude: loud notes count more, but don't drown out the rest.
      profile[pc] = (profile[pc] ?? 0) + Math.sqrt(Math.hypot(re[bin] ?? 0, im[bin] ?? 0));
    }
  }

  const total = profile.reduce((sum, v) => sum + v, 0) || 1;
  return profile.map((v) => v / total);
}

function correlation(a: readonly number[], b: readonly number[]): number {
  const mean = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const ma = mean(a);
  const mb = mean(b);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < a.length; i++) {
    const x = (a[i] ?? 0) - ma;
    const y = (b[i] ?? 0) - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  return num / Math.sqrt(da * db || 1);
}

/** The key whose profile best matches the pitch-class profile. */
export function keyFromChroma(profile: readonly number[]): Key {
  let best: Key = { tonic: 0, mode: 'major' };
  let bestScore = -Infinity;
  for (let tonic = 0; tonic < 12; tonic++) {
    // Rotate the song's profile so the candidate tonic sits at index 0.
    const rotated = profile.map((_, i) => profile[(i + tonic) % 12] ?? 0);
    for (const [mode, template] of [
      ['major', MAJOR],
      ['minor', MINOR],
    ] as const) {
      const score = correlation(rotated, template);
      if (score > bestScore) {
        bestScore = score;
        best = { tonic, mode };
      }
    }
  }
  return best;
}

export function detectKey(samples: Float32Array, sampleRate: number): Key {
  return keyFromChroma(chroma(samples, sampleRate));
}

/** "A minor", "E♭ major". */
export function keyName(key: Key): string {
  return `${NOTES[key.tonic]} ${key.mode}`;
}

/**
 * Camelot code used by DJs: the number moves around the circle of fifths, A is minor and
 * B is major. C major = 8B, A minor = 8A.
 */
export function camelot(key: Key): string {
  const majorTonic = key.mode === 'major' ? key.tonic : (key.tonic + 3) % 12;
  const number = ((((majorTonic * 7) % 12) + 7) % 12) + 1;
  return `${number}${key.mode === 'major' ? 'B' : 'A'}`;
}

const LETTERS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Reads key names like "A flat minor", "F♯ major" or "Bb minor". Null if it isn't one. */
export function parseKeyName(name: string): Key | null {
  const match = name.trim().match(/^([A-Ga-g])\s*(sharp|flat|♯|♭|#|b)?\s*(major|minor|maj|min)$/i);
  if (!match) return null;
  const [, letter = '', accidental = '', mode = ''] = match;
  const shift = /sharp|♯|#/i.test(accidental) ? 1 : /flat|♭|^b$/i.test(accidental) ? -1 : 0;
  return {
    tonic: ((LETTERS[letter.toUpperCase()] ?? 0) + shift + 12) % 12,
    mode: /^min/i.test(mode) ? 'minor' : 'major',
  };
}
