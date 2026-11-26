import { library } from '$lib/library/library.svelte';
import type { Track } from '$lib/library/types';
import { sky } from '$lib/sky/sky.svelte';
import { forMoods, searchTracks, trending } from './audius';
import { moodFor } from './moods';

type Status = 'idle' | 'loading' | 'error';

/** Discover: free songs from Audius, picked for the sky, trending, or searched. */
class Discover {
  mood = $derived(moodFor(sky.weather?.condition ?? null, sky.time));
  forSky = $state<Track[]>([]);
  trending = $state<Track[]>([]);
  results = $state<Track[] | null>(null);
  skyStatus = $state<Status>('idle');
  trendingStatus = $state<Status>('idle');
  searching = $state(false);
  searchError = $state(false);

  #loadedMoods = '';

  /** Loads the sky picks (again only when the mood changes) and trending (once). */
  async refresh(): Promise<void> {
    await Promise.all([this.#loadSky(), this.#loadTrending()]);
  }

  async search(query: string): Promise<void> {
    const q = query.trim();
    if (!q) {
      this.results = null;
      return;
    }
    this.searching = true;
    this.searchError = false;
    try {
      this.results = this.#remember(await searchTracks(q));
    } catch {
      this.searchError = true;
    } finally {
      this.searching = false;
    }
  }

  async #loadSky(): Promise<void> {
    const key = this.mood.moods.join(',');
    if (key === this.#loadedMoods && this.forSky.length) return;
    this.skyStatus = 'loading';
    try {
      this.forSky = this.#remember(await forMoods(this.mood.moods));
      this.#loadedMoods = key;
      this.skyStatus = 'idle';
    } catch {
      this.skyStatus = 'error';
    }
  }

  async #loadTrending(): Promise<void> {
    if (this.trending.length) return;
    this.trendingStatus = 'loading';
    try {
      this.trending = this.#remember(await trending());
      this.trendingStatus = 'idle';
    } catch {
      this.trendingStatus = 'error';
    }
  }

  #remember(tracks: Track[]): Track[] {
    library.rememberStreams(tracks);
    return tracks;
  }
}

export const discover = new Discover();
