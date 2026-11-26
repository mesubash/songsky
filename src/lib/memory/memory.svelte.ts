import { addPlay, allPlays } from '$lib/library/db';
import type { PlayRecord } from '$lib/library/types';
import { sky } from '$lib/sky/sky.svelte';
import { groupByPlace } from './places';

const STORAGE_KEY = 'songsky:memory';

/** Listening history, and whether to remember where each song was played. */
class Memory {
  /** Off until the person turns it on. Plays are always kept; places only when on. */
  rememberPlaces = $state(false);
  plays = $state<PlayRecord[]>([]);
  places = $derived(groupByPlace(this.plays));

  constructor() {
    try {
      this.rememberPlaces = localStorage.getItem(STORAGE_KEY) === 'on';
    } catch {
      // Storage unavailable: stays off.
    }
  }

  async load(): Promise<void> {
    this.plays = (await allPlays()).sort((a, b) => b.playedAt - a.playedAt);
  }

  setRememberPlaces(on: boolean): void {
    this.rememberPlaces = on;
    try {
      localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
    } catch {
      // Lasts for this visit only.
    }
  }

  async record(trackId: string): Promise<void> {
    const record: PlayRecord = { trackId, playedAt: Date.now() };
    if (this.rememberPlaces && sky.place) {
      record.place = $state.snapshot(sky.place);
      if (sky.weather) record.weather = sky.weather.condition;
    }
    this.plays = [record, ...this.plays];
    await addPlay(record);
  }

  /** Called when the library is cleared, since that also clears history. */
  forget(): void {
    this.plays = [];
  }
}

export const memory = new Memory();
