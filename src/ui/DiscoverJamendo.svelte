<script lang="ts">
import { type JamendoOrder, jamendoTracks } from '$lib/discover/jamendo';
import { library } from '$lib/library/library.svelte';
import type { Track } from '$lib/library/types';
import { player } from '$lib/player/player.svelte';
import Button from './Button.svelte';
import Icon from './Icon.svelte';
import TrackList from './TrackList.svelte';
import TrackSkeleton from './TrackSkeleton.svelte';

/** Free Creative Commons music from Jamendo: by style, or search. */

const STYLES: { tag: string; label: string }[] = [
  { tag: '', label: 'Popular' },
  { tag: 'pop', label: 'Pop' },
  { tag: 'rock', label: 'Rock' },
  { tag: 'electronic', label: 'Electronic' },
  { tag: 'hiphop', label: 'Hip-hop' },
  { tag: 'lounge', label: 'Lounge' },
  { tag: 'jazz', label: 'Jazz' },
  { tag: 'classical', label: 'Classical' },
  { tag: 'ambient', label: 'Ambient' },
  { tag: 'acoustic', label: 'Acoustic' },
  { tag: 'world', label: 'World' },
  { tag: 'soundtrack', label: 'Soundtrack' },
];

const ORDERS: { id: JamendoOrder; label: string }[] = [
  { id: 'popularity_week', label: 'This week' },
  { id: 'popularity_month', label: 'This month' },
  { id: 'popularity_total', label: 'All time' },
];

let style = $state('');
let order = $state<JamendoOrder>('popularity_week');
let query = $state('');
let searched = $state('');
let tracks = $state<Track[]>([]);
let status = $state<'idle' | 'loading' | 'error'>('loading');

const cache = new Map<string, Track[]>();

$effect(() => {
  const key = `${searched}|${style}|${order}`;
  const cached = cache.get(key);
  if (cached) {
    tracks = cached;
    status = 'idle';
    return;
  }
  let alive = true;
  status = 'loading';
  jamendoTracks({
    search: searched || undefined,
    tags: searched ? undefined : style || undefined,
    order,
  })
    .then((found) => {
      if (!alive) return;
      library.rememberStreams(found);
      cache.set(key, found);
      tracks = found;
      status = 'idle';
    })
    .catch(() => {
      if (alive) status = 'error';
    });
  return () => {
    alive = false;
  };
});
</script>

<div class="jamendo">
  <div class="tools">
    <fieldset class="chips">
      <legend class="visually-hidden">Styles</legend>
      {#each STYLES as option (option.tag)}
        <button
          type="button"
          class="chip"
          aria-pressed={!searched && style === option.tag}
          onclick={() => {
            style = option.tag;
            searched = '';
            query = '';
          }}
        >
          {option.label}
        </button>
      {/each}
    </fieldset>
    <div class="row">
      <search>
        <form
          class="find"
          onsubmit={(e) => {
            e.preventDefault();
            searched = query.trim();
          }}
        >
          <label class="visually-hidden" for="jamendo-search">Search Jamendo</label>
          <Icon name="search" size={16} />
          <input
            id="jamendo-search"
            type="search"
            placeholder="Search Jamendo"
            autocomplete="off"
            bind:value={query}
            oninput={() => {
              if (!query.trim()) searched = '';
            }}
          >
        </form>
      </search>
      <fieldset class="segmented">
        <legend class="visually-hidden">Most played</legend>
        {#each ORDERS as option (option.id)}
          <button
            type="button"
            aria-pressed={order === option.id}
            onclick={() => (order = option.id)}
          >
            {option.label}
          </button>
        {/each}
      </fieldset>
      <Button
        variant="primary"
        icon="play"
        disabled={!tracks.length}
        onclick={() => player.playInOrder(tracks.map((t) => t.id))}
        >Play all</Button
      >
    </div>
  </div>

  {#if status === 'loading' && !tracks.length}
    <TrackSkeleton label="Loading songs from Jamendo" />
  {:else if status === 'error'}
    <p class="note">Couldn’t reach Jamendo. Check your connection and try again.</p>
  {:else if tracks.length}
    <TrackList {tracks} />
  {:else}
    <p class="note">No songs found. Try another word or style.</p>
  {/if}

  <p class="note">
    Songs from
    <a href="https://www.jamendo.com" target="_blank" rel="noopener noreferrer">Jamendo</a>, shared
    by their artists under Creative Commons licences for personal listening.
  </p>
</div>

<style>
.jamendo {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-2) 0 var(--space-8);
}

.tools {
  display: grid;
  gap: var(--space-4);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.chip {
  min-height: 36px;
  padding: 0 var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text);
  font-size: var(--text-sm);
  font-weight: 550;
}

.chip:hover {
  background: var(--surface-strong);
}

.chip[aria-pressed="true"] {
  border-color: transparent;
  background: var(--accent);
  color: var(--on-accent);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.find {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: min(100%, 22rem);
  min-height: 44px;
  padding: 0 var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text-muted);
}

.find:focus-within {
  border-color: var(--accent);
}

.find input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: none;
  color: var(--text);
  font: inherit;
}

.segmented {
  display: flex;
  gap: 2px;
  min-width: 0;
  margin: 0;
  padding: 3px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--surface-strong);
}

.segmented button {
  min-height: 36px;
  padding: 0 var(--space-3);
  border: 0;
  border-radius: var(--radius-full);
  background: none;
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-weight: 600;
}

.segmented button[aria-pressed="true"] {
  background: var(--accent);
  color: var(--on-accent);
}

.note {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.note a {
  color: var(--text);
}
</style>
