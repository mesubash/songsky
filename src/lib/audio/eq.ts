export interface EqBand {
  frequency: number;
  type: BiquadFilterType;
  label: string;
}

/** Five bands, spaced roughly evenly on a log scale across what ears care about. */
export const EQ_BANDS: readonly EqBand[] = [
  { frequency: 60, type: 'lowshelf', label: '60 Hz' },
  { frequency: 230, type: 'peaking', label: '230 Hz' },
  { frequency: 910, type: 'peaking', label: '910 Hz' },
  { frequency: 3600, type: 'peaking', label: '3.6 kHz' },
  { frequency: 14000, type: 'highshelf', label: '14 kHz' },
];

export const EQ_RANGE_DB = 12;

export const EQ_PRESETS = {
  flat: { label: 'Flat', gains: [0, 0, 0, 0, 0] },
  bass: { label: 'Bass boost', gains: [6, 3, 0, 0, 0] },
  vocal: { label: 'Vocal', gains: [-2, 0, 3, 3, 0] },
  bright: { label: 'Bright', gains: [0, 0, 0, 3, 5] },
  warm: { label: 'Warm', gains: [3, 1, 0, -2, -4] },
} as const satisfies Record<string, { label: string; gains: readonly number[] }>;

export type EqPresetId = keyof typeof EQ_PRESETS;

/** Which preset these gains match, or null for a custom curve. */
export function presetFor(gains: readonly number[]): EqPresetId | null {
  for (const [id, preset] of Object.entries(EQ_PRESETS)) {
    if (preset.gains.every((g, i) => g === gains[i])) return id as EqPresetId;
  }
  return null;
}

/**
 * How long a crossfade can run: the user's setting, but never longer than what is
 * left of the outgoing song or half of the incoming one.
 */
export function fadeLength(setting: number, remainingOld: number, durationNew: number): number {
  const limits = [setting, remainingOld];
  if (durationNew > 0) limits.push(durationNew / 2);
  return Math.max(0, Math.min(...limits));
}
