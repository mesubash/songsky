const KEY = 'songsky:prefs';

/** Where Discover finds music. Each can be turned off in Settings. */
export type MusicSource = 'audius' | 'jamendo' | 'radio';

/** What Songsky plays: your own files, online music, or both. */
export type PlayMode = 'both' | 'local' | 'online';

interface SavedPrefs {
  weatherEffects: boolean;
  sources: Record<MusicSource, boolean>;
  mode: PlayMode;
}

const DEFAULTS: SavedPrefs = {
  weatherEffects: true,
  sources: { audius: true, jamendo: true, radio: true },
  mode: 'both',
};

/** Small display preferences, saved on this device. */
class Prefs {
  /** Rain and snow drawn over the page when the weather has them. */
  weatherEffects = $state(DEFAULTS.weatherEffects);
  sources = $state<Record<MusicSource, boolean>>({ ...DEFAULTS.sources });
  mode = $state<PlayMode>(DEFAULTS.mode);

  /** Online music (Discover, radio) is part of Songsky. */
  get onlineMusic(): boolean {
    return this.mode !== 'local';
  }

  /** Your own files can be added (folders, files, dropping). */
  get localMusic(): boolean {
    return this.mode !== 'online';
  }

  constructor() {
    try {
      const saved: Partial<SavedPrefs> = JSON.parse(localStorage.getItem(KEY) ?? '{}');
      if (typeof saved.weatherEffects === 'boolean') this.weatherEffects = saved.weatherEffects;
      if (saved.mode === 'both' || saved.mode === 'local' || saved.mode === 'online') {
        this.mode = saved.mode;
      }
      for (const source of Object.keys(DEFAULTS.sources) as MusicSource[]) {
        const on = saved.sources?.[source];
        if (typeof on === 'boolean') this.sources[source] = on;
      }
    } catch {
      // Keep the defaults.
    }
  }

  setWeatherEffects(on: boolean): void {
    this.weatherEffects = on;
    this.#save();
  }

  setMode(mode: PlayMode): void {
    this.mode = mode;
    this.#save();
  }

  setSource(source: MusicSource, on: boolean): void {
    this.sources[source] = on;
    this.#save();
  }

  #save(): void {
    try {
      const saved: SavedPrefs = {
        weatherEffects: this.weatherEffects,
        sources: $state.snapshot(this.sources),
        mode: this.mode,
      };
      localStorage.setItem(KEY, JSON.stringify(saved));
    } catch {
      // Lasts for this visit only.
    }
  }
}

export const prefs = new Prefs();
