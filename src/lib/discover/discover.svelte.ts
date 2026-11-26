import { library } from '$lib/library/library.svelte';
import type { Track } from '$lib/library/types';
import { prefs } from '$lib/prefs.svelte';
import { sky } from '$lib/sky/sky.svelte';
import { forMoods, searchTracks, trending } from './audius';
import { jamendoAvailable, jamendoTracks } from './jamendo';
import { moodFor } from './moods';
import { interleave } from './sources';

type Status = 'idle' | 'loading' | 'error';

/**
 * Discover: free songs picked for the sky, trending, or searched. Audius and Jamendo are
 * sources of the same lists (whichever are turned on in Settings), not separate places.
 */
class Discover {
  mood = $derived(moodFor(sky.weather?.condition ?? null, sky.time));
  forSky = $state<Track[]>([]);
  trending = $state<Track[]>([]);
  /** Popular Creative Commons songs from Jamendo, shown in For you. */
  jamendoPicks = $state<Track[]>([]);
  results = $state<Track[] | null>(null);
  skyStatus = $state<Status>('idle');
  trendingStatus = $state<Status>('idle');
  jamendoStatus = $state<Status>('idle');
  searching = $state(false);
  /** What is typed in the search box (shared by the header and Discover). */
  query = $state('');
  /** The query the current results are for. */
  searched = $state('');
  searchError = $state(false);
  /** Songsky's server has a Jamendo key (checked once). */
  jamendoReady = $state(false);

  /** Jamendo is set up on the server and turned on in Settings. */
  get useJamendo(): boolean {
    return this.jamendoReady && prefs.sources.jamendo;
  }

  get useAudius(): boolean {
    return prefs.sources.audius;
  }

  /** Any source that can fill Discover's song lists is on. */
  get hasSongs(): boolean {
    return this.useAudius || this.useJamendo;
  }

  #loadedSky = '';
  #checkedJamendo: Promise<void> | null = null;

  /** Loads the sky picks (again only when the mood or sources change), trending and Jamendo picks. */
  async refresh(): Promise<void> {
    await this.#checkJamendo();
    await Promise.all([this.#loadSky(), this.#loadTrending(), this.#loadJamendo()]);
  }

  async search(query: string): Promise<void> {
    const q = query.trim();
    if (!q) {
      this.results = null;
      this.searched = '';
      return;
    }
    this.searched = q;
    this.searching = true;
    this.searchError = false;
    await this.#checkJamendo();
    const [audius, jamendo] = await Promise.allSettled([
      this.useAudius ? searchTracks(q) : Promise.resolve([]),
      this.useJamendo
        ? jamendoTracks({ search: q, order: 'popularity_total' }, 20)
        : Promise.resolve([]),
    ]);
    const found = [audius, jamendo].map((r) => (r.status === 'fulfilled' ? r.value : []));
    this.searchError = audius.status === 'rejected' && jamendo.status === 'rejected';
    this.results = this.#remember(interleave(...found));
    this.searching = false;
  }

  #checkJamendo(): Promise<void> {
    this.#checkedJamendo ??= jamendoAvailable().then((ok) => {
      this.jamendoReady = ok;
    });
    return this.#checkedJamendo;
  }

  async #loadSky(): Promise<void> {
    // With Audius off, the sky picks come from Jamendo's most played this week.
    const key = `${this.mood.moods.join(',')}|${this.useAudius}|${this.useJamendo}`;
    if (key === this.#loadedSky && this.forSky.length) return;
    if (!this.hasSongs) {
      this.forSky = [];
      return;
    }
    this.skyStatus = 'loading';
    try {
      this.forSky = this.#remember(
        this.useAudius
          ? await forMoods(this.mood.moods)
          : await jamendoTracks({ order: 'popularity_week' }, 24),
      );
      this.#loadedSky = key;
      this.skyStatus = 'idle';
    } catch {
      this.skyStatus = 'error';
    }
  }

  async #loadTrending(): Promise<void> {
    if (!this.useAudius || this.trending.length) return;
    this.trendingStatus = 'loading';
    try {
      this.trending = this.#remember(await trending());
      this.trendingStatus = 'idle';
    } catch {
      this.trendingStatus = 'error';
    }
  }

  async #loadJamendo(): Promise<void> {
    if (!this.useJamendo || this.jamendoPicks.length) return;
    this.jamendoStatus = 'loading';
    try {
      this.jamendoPicks = this.#remember(await jamendoTracks({ order: 'popularity_month' }, 20));
      this.jamendoStatus = 'idle';
    } catch {
      this.jamendoStatus = 'error';
    }
  }

  #remember(tracks: Track[]): Track[] {
    library.rememberStreams(tracks);
    return tracks;
  }
}

export const discover = new Discover();
