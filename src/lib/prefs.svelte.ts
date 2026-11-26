const KEY = 'songsky:prefs';

interface SavedPrefs {
  weatherEffects: boolean;
}

/** Small display preferences, saved on this device. */
class Prefs {
  /** Rain and snow drawn over the page when the weather has them. */
  weatherEffects = $state(true);

  constructor() {
    try {
      const saved: Partial<SavedPrefs> = JSON.parse(localStorage.getItem(KEY) ?? '{}');
      if (typeof saved.weatherEffects === 'boolean') this.weatherEffects = saved.weatherEffects;
    } catch {
      // Keep the defaults.
    }
  }

  setWeatherEffects(on: boolean): void {
    this.weatherEffects = on;
    try {
      localStorage.setItem(KEY, JSON.stringify({ weatherEffects: on } satisfies SavedPrefs));
    } catch {
      // Lasts for this visit only.
    }
  }
}

export const prefs = new Prefs();
