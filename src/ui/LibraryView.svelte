<script lang="ts">
import { analyzer } from '$lib/analysis/analyzer.svelte';
import { formatLength } from '$lib/format';
import { browse, SORT_LABELS, type SortOrder } from '$lib/library/browse';
import { library } from '$lib/library/library.svelte';
import { memory } from '$lib/memory/memory.svelte';
import { player } from '$lib/player/player.svelte';
import Icon from './Icon.svelte';
import LibraryActions from './LibraryActions.svelte';
import TrackList from './TrackList.svelte';

const count = $derived(library.tracks.length);

const SORT_KEY = 'songsky:library-sort';
let query = $state('');
let order = $state<SortOrder>(
  (Object.keys(SORT_LABELS) as SortOrder[]).find((o) => o === localStorage.getItem(SORT_KEY)) ??
    'artist',
);
const shown = $derived(browse(library.tracks, query, order));

function setOrder(next: SortOrder) {
  order = next;
  try {
    localStorage.setItem(SORT_KEY, next);
  } catch {
    // Remembered for this visit only.
  }
}

function clearLibrary() {
  if (confirm('Remove all songs from Songsky? Your files on this device are not deleted.')) {
    player.pause();
    void library.clear();
    memory.forget();
  }
}
</script>

<section aria-labelledby="library-title">
  <div class="head">
    <div class="desktop-title">
      <h2 id="library-title" class="title">Library</h2>
      <p class="meta">
        {count}
        {count === 1 ? 'song' : 'songs'}{library.totalDuration
          ? `, ${formatLength(library.totalDuration)}`
          : ''}
      </p>
      {#if analyzer.progress}
        <p class="meta" aria-live="polite">
          Reading tempo and key: {analyzer.progress.done} of {analyzer.progress.total}
        </p>
      {/if}
    </div>
    <div class="actions">
      <LibraryActions />
      <div class="find">
        <search class="filter">
          <label class="visually-hidden" for="library-filter">Search your library</label>
          <Icon name="search" size={16} />
          <input
            id="library-filter"
            type="search"
            placeholder="Search your library"
            autocomplete="off"
            bind:value={query}
          >
        </search>
        <label class="visually-hidden" for="library-sort">Sort by</label>
        <select
          id="library-sort"
          class="sort"
          value={order}
          onchange={(e) => setOrder(e.currentTarget.value as SortOrder)}
        >
          {#each Object.entries(SORT_LABELS) as [value, label] (value)}
            <option {value}>{label}</option>
          {/each}
        </select>
      </div>
      <button class="clear" type="button" onclick={clearLibrary}>Clear library</button>
    </div>
  </div>

  {#if shown.length}
    <TrackList tracks={shown} />
  {:else}
    <p class="no-match">
      No songs match “{query}”.
      <button type="button" onclick={() => (query = '')}>Show all songs</button>
    </p>
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

.meta {
  color: var(--text-muted);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.find {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.filter {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 40px;
  padding: 0 var(--space-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text-muted);
}

.filter:focus-within {
  border-color: var(--accent);
}

.filter input {
  width: 12rem;
  border: 0;
  outline: none;
  background: none;
  color: var(--text);
  font: inherit;
  font-size: var(--text-sm);
}

.sort {
  min-height: 40px;
  padding: 0 var(--space-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: var(--text-sm);
}

.no-match {
  padding: var(--space-8) var(--space-3);
  color: var(--text-muted);
}

.no-match button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--text);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.clear {
  min-height: 44px;
  padding: 0 var(--space-3);
  border: 0;
  background: none;
  color: var(--text-muted);
  font-size: var(--text-sm);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.clear:hover {
  color: var(--text);
}

/* Desktop shows the title in the top bar, so this row holds only the actions:
   Play all, Shuffle and Mix on the left, Clear library on the right. */
@media (min-width: 1100px) {
  .head {
    padding-block: var(--space-6) var(--space-4);
  }

  .actions {
    flex: 1;
  }

  .find {
    margin-left: auto;
  }
}
</style>
