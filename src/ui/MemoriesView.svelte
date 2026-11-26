<script lang="ts">
import { library } from '$lib/library/library.svelte';
import { memory } from '$lib/memory/memory.svelte';
import { timeAgo } from '$lib/memory/places';
import { player } from '$lib/player/player.svelte';
import { sky } from '$lib/sky/sky.svelte';
import MemoryMap from './MemoryMap.svelte';

const RECENT = 30;

const recent = $derived(memory.plays.slice(0, RECENT));
const placeCount = $derived(memory.places.length);
const ids = $derived(library.tracks.map((t) => t.id));

function startTrack(trackId: string) {
  const index = ids.indexOf(trackId);
  if (index >= 0) void player.playList(ids, index);
}
</script>

<section aria-labelledby="memories-title">
  <div class="head">
    <div>
      <h2 id="memories-title" class="title">Memories</h2>
      <p class="meta">
        {#if memory.plays.length === 0}
          Songs you play show up here.
        {:else}
          {memory.plays.length} {memory.plays.length === 1 ? 'play' : 'plays'}{placeCount
            ? ` in ${placeCount} ${placeCount === 1 ? 'place' : 'places'}`
            : ''}
        {/if}
      </p>
    </div>
    <label class="switch">
      <input
        type="checkbox"
        role="switch"
        aria-checked={memory.rememberPlaces}
        checked={memory.rememberPlaces}
        onchange={(e) => memory.setRememberPlaces(e.currentTarget.checked)}
      >
      <span>Remember where I listen</span>
    </label>
  </div>

  {#if memory.rememberPlaces && !sky.place}
    <p class="hint">
      Use the sky button at the top to share your location or pick a city, so Attune knows where you
      are.
    </p>
  {:else if !memory.rememberPlaces && placeCount === 0}
    <p class="hint">
      Turn on “Remember where I listen” to see your songs on a map. Places stay on this device; only
      map tiles come from OpenStreetMap.
    </p>
  {/if}

  {#if placeCount > 0}
    <MemoryMap places={memory.places} />
  {/if}

  {#if recent.length > 0}
    <h3 class="subtitle">Recently played</h3>
    <ol class="recent">
      {#each recent as entry (entry.playedAt)}
        {@const track = library.byId.get(entry.trackId)}
        <li>
          <button
            class="row"
            type="button"
            disabled={!track}
            onclick={() => startTrack(entry.trackId)}
          >
            <span class="main">
              <span class="name">{track?.title ?? 'Removed song'}</span>
              <span class="where"
                >{track?.artist ?? ''}{entry.place ? `, ${entry.place.name}` : ''}</span
              >
            </span>
            <span class="when">{timeAgo(entry.playedAt)}</span>
          </button>
        </li>
      {/each}
    </ol>
  {/if}
</section>

<style>
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  padding-block: var(--space-8) var(--space-4);
}

.title {
  font-size: var(--text-2xl);
  letter-spacing: -0.02em;
}

.meta,
.hint,
.where,
.when {
  color: var(--text-muted);
}

.hint {
  max-width: 40rem;
  margin-bottom: var(--space-4);
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 44px;
  cursor: pointer;
}

.switch input {
  width: 44px;
  height: 26px;
  margin: 0;
  border-radius: var(--radius-full);
  background: var(--line);
  appearance: none;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.switch input::before {
  content: "";
  display: block;
  width: 20px;
  height: 20px;
  margin: 3px;
  border-radius: 50%;
  background: var(--text);
  transition: transform var(--duration-fast) var(--ease-out);
}

.switch input:checked {
  background: var(--accent);
}

.switch input:checked::before {
  background: var(--on-accent);
  transform: translateX(18px);
}

.subtitle {
  padding-block: var(--space-8) var(--space-2);
  font-size: var(--text-lg);
}

.recent {
  padding: 0;
  list-style: none;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  width: 100%;
  min-height: 56px;
  padding: var(--space-2) var(--space-3);
  border: 0;
  border-radius: var(--radius-md);
  background: none;
  text-align: start;
}

.row:disabled {
  opacity: 0.5;
  cursor: default;
}

.row:hover:not(:disabled) {
  background: var(--surface);
}

.main {
  display: grid;
  min-width: 0;
}

.name,
.where {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.name {
  font-weight: 550;
}

.where,
.when {
  font-size: var(--text-sm);
}

.when {
  flex: none;
}
</style>
