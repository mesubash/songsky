import { updateTabIcon } from './tab-icon';
import { applySky, type Sky, skyForHour } from './time';
import {
  fetchWeather,
  formatCoordinates,
  type Place,
  placeName,
  roundCoordinate,
  type Weather,
} from './weather';

const STORAGE_KEY = 'songsky:sky';
const REFRESH_MS = 30 * 60 * 1000;
const TICK_MS = 5 * 60 * 1000;

/** The device's position, rounded and named after its town (or its coordinates offline). */
async function locate(previous: Place | null = null): Promise<Place> {
  const position = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: REFRESH_MS,
      timeout: 15_000,
    }),
  );
  const latitude = roundCoordinate(position.coords.latitude);
  const longitude = roundCoordinate(position.coords.longitude);
  // Same spot as before: keep its name instead of looking it up again.
  if (
    previous?.latitude === latitude &&
    previous.longitude === longitude &&
    !isCoordinateName(previous.name)
  ) {
    return previous;
  }
  const name = (await placeName(latitude, longitude)) ?? formatCoordinates(latitude, longitude);
  return { name, latitude, longitude };
}

const isCoordinateName = (name: string) => /°[NS], /.test(name);

/** True only when location was already allowed, so asking won't show a prompt. */
async function locationAllowed(): Promise<boolean> {
  try {
    return (await navigator.permissions.query({ name: 'geolocation' })).state === 'granted';
  } catch {
    return false;
  }
}

/** Where the weather comes from. "time" means no weather: the sky follows the clock only. */
export type SkySource = 'time' | 'location' | 'city';

interface SavedSky {
  source: SkySource;
  place: Place | null;
  weather: Weather | null;
  fetchedAt: number;
  /** Location was asked for once already, so it is never asked again by itself. */
  askedForLocation?: boolean;
}

class SkyState {
  time = $state<Sky>(skyForHour(new Date().getHours()));
  source = $state<SkySource>('time');
  /** Rounded to ~11 km before it is stored or sent anywhere. */
  place = $state<Place | null>(null);
  weather = $state<Weather | null>(null);
  loading = $state(false);
  /** Whether the sky panel (location and city search) is open; other screens can open it. */
  panelOpen = $state(false);
  error = $state<string | null>(null);

  #fetchedAt = 0;
  #askedForLocation = false;

  start(): void {
    this.#restore();
    this.#apply();
    if (this.source === 'time' && !this.#askedForLocation) {
      // First visit: ask once, so the sky follows the real weather by default.
      // If the answer is no, the sky stays on time of day and city search remains.
      this.#askedForLocation = true;
      this.#save();
      void this.useLocation();
    } else {
      void this.refresh();
    }
    setInterval(() => {
      this.time = skyForHour(new Date().getHours());
      this.#apply();
      void this.refresh();
    }, TICK_MS);
  }

  /** Asks for the device location. Falls back to an error message (and city search). */
  async useLocation(): Promise<void> {
    if (!('geolocation' in navigator) || !window.isSecureContext) {
      this.error = 'Location isn’t available here. Search for your city instead.';
      return;
    }
    this.loading = true;
    this.error = null;
    try {
      this.place = await locate();
      this.source = 'location';
      await this.refresh(true);
    } catch {
      this.loading = false;
      this.error = 'Location wasn’t shared. Search for your city instead.';
    }
  }

  async useCity(place: Place): Promise<void> {
    this.source = 'city';
    this.place = {
      ...place,
      latitude: roundCoordinate(place.latitude),
      longitude: roundCoordinate(place.longitude),
    };
    this.error = null;
    await this.refresh(true);
  }

  useTimeOnly(): void {
    this.source = 'time';
    this.place = null;
    this.weather = null;
    this.error = null;
    this.#fetchedAt = 0;
    this.#apply();
    this.#save();
  }

  /** Fetches the weather if it's older than 30 minutes (or always, with `force`). */
  async refresh(force = false): Promise<void> {
    if (!this.place || this.source === 'time') return;
    if (!force && Date.now() - this.#fetchedAt < REFRESH_MS) return;
    this.loading = true;
    // Follow the person as they move, but only if location is already allowed.
    if (!force && this.source === 'location' && (await locationAllowed())) {
      const previous = this.place;
      this.place = await locate(previous).catch(() => previous);
    }
    try {
      if (!this.place) return;
      this.weather = await fetchWeather(this.place);
      this.#fetchedAt = Date.now();
      this.error = null;
    } catch {
      // Offline or the service is down: keep the last known weather.
      if (force) this.error = 'Couldn’t get the weather. Check your connection and try again.';
    } finally {
      this.loading = false;
      this.#apply();
      this.#save();
    }
  }

  #apply(): void {
    applySky(this.time);
    const root = document.documentElement;
    if (this.weather) root.dataset.weather = this.weather.condition;
    else delete root.dataset.weather;
    updateTabIcon();
  }

  #restore(): void {
    try {
      const saved: SavedSky | null = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      if (!saved) return;
      this.source = saved.source;
      this.place = saved.place;
      this.weather = saved.weather;
      this.#fetchedAt = saved.fetchedAt;
      this.#askedForLocation = saved.askedForLocation ?? saved.source !== 'time';
    } catch {
      // Ignore corrupt settings.
    }
  }

  #save(): void {
    const saved: SavedSky = {
      source: this.source,
      place: $state.snapshot(this.place),
      weather: $state.snapshot(this.weather),
      fetchedAt: this.#fetchedAt,
      askedForLocation: this.#askedForLocation,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // Storage unavailable: the choice lasts for this visit.
    }
  }
}

export const sky = new SkyState();
