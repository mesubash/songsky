import { addPlay, allPlays, clearPlays } from '$lib/library/db';
import { library } from '$lib/library/library.svelte';
import type { PlayRecord, Track } from '$lib/library/types';
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
    // Make streamed songs from history playable again after a reload.
    library.rememberStreams(this.plays.flatMap((play) => (play.stream ? [play.stream] : [])));
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
    const track = library.byId.get(trackId);
    if (track?.source === 'stream') record.stream = $state.snapshot(track) as Track;
    if (this.rememberPlaces && sky.place) {
      record.place = $state.snapshot(sky.place);
      if (sky.weather) record.weather = sky.weather.condition;
    }
    this.plays = [record, ...this.plays];
    await addPlay(record);
  }

  /** Deletes listening history and places, keeping the songs. */
  async clearHistory(): Promise<void> {
    this.plays = [];
    await clearPlays();
  }

  /** Called when the library is cleared, since that also clears history. */
  forget(): void {
    this.plays = [];
  }
}

export const memory = new Memory();
