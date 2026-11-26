import { EQ_BANDS, EQ_PRESETS, EQ_RANGE_DB, type EqPresetId, presetFor } from './eq';

const STORAGE_KEY = 'songsky:sound';
export const CROSSFADE_MAX = 12;
const CROSSFADE_DEFAULT = 4;

interface SavedSound {
  crossfade: number;
  eq: number[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Sound preferences: crossfade length and EQ. Saved between visits. */
class Sound {
  /** Seconds. 0 turns crossfade off. */
  crossfade = $state(CROSSFADE_DEFAULT);
  eq = $state<number[]>(EQ_BANDS.map(() => 0));
  preset = $derived<EqPresetId | null>(presetFor(this.eq));

  constructor() {
    try {
      const saved: SavedSound | null = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      if (saved) {
        this.crossfade = clamp(saved.crossfade, 0, CROSSFADE_MAX);
        this.eq = EQ_BANDS.map((_, i) => clamp(saved.eq[i] ?? 0, -EQ_RANGE_DB, EQ_RANGE_DB));
      }
    } catch {
      // Corrupt or missing settings: keep the defaults.
    }
  }

  setCrossfade(seconds: number): void {
    this.crossfade = clamp(seconds, 0, CROSSFADE_MAX);
    this.#save();
  }

  setBand(index: number, gain: number): void {
    this.eq[index] = clamp(gain, -EQ_RANGE_DB, EQ_RANGE_DB);
    this.#save();
  }

  /** True when crossfade and EQ are at their starting values. */
  get isDefault(): boolean {
    return this.crossfade === CROSSFADE_DEFAULT && this.eq.every((gain) => gain === 0);
  }

  /** Back to the starting values: 4 s crossfade and a flat EQ. */
  reset(): void {
    this.crossfade = CROSSFADE_DEFAULT;
    this.eq = EQ_BANDS.map(() => 0);
    this.#save();
  }

  usePreset(id: EqPresetId): void {
    this.eq = [...EQ_PRESETS[id].gains];
    this.#save();
  }

  #save(): void {
    try {
      const saved: SavedSound = { crossfade: this.crossfade, eq: $state.snapshot(this.eq) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // Storage unavailable: settings last for this visit only.
    }
  }
}

export const sound = new Sound();
