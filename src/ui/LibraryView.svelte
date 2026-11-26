<script lang="ts">
import { analyzer } from '$lib/analysis/analyzer.svelte';
import { ask } from '$lib/confirm.svelte';
import { formatLength } from '$lib/format';
import { browse, SORT_LABELS, type SortOrder } from '$lib/library/browse';
import { library } from '$lib/library/library.svelte';
import { memory } from '$lib/memory/memory.svelte';
import { player } from '$lib/player/player.svelte';
import { playlists } from '$lib/playlists/playlists.svelte';
import { playlistHref } from '$lib/view.svelte';
import Icon from './Icon.svelte';
import LibraryActions from './LibraryActions.svelte';
import { placeMenu } from './menu';
import TrackList from './TrackList.svelte';

const count = $derived(library.tracks.length);

const SORT_KEY = 'songsky:library-sort';
let sortButton = $state<HTMLButtonElement>();
let sortMenu = $state<HTMLDivElement>();
let query = $state('');
let order = $state<SortOrder>(
  (Object.keys(SORT_LABELS) as SortOrder[]).find((o) => o === localStorage.getItem(SORT_KEY)) ??
    'artist',
);
const shown = $derived(browse(library.tracks, query, order));

async function newPlaylist() {
  const playlist = await playlists.create();
  location.hash = playlistHref(playlist.id);
}

function setOrder(next: SortOrder) {
  order = next;
  try {
    localStorage.setItem(SORT_KEY, next);
  } catch {
    // Remembered for this visit only.
  }
}

async function clearLibrary() {
  const ok = await ask({
    title: 'Clear your library?',
    message:
      'Every song, playlist and play is removed from Songsky. Music files on your device are not touched.',
    action: 'Clear library',
  });
  if (!ok) return;
  player.pause();
  void library.clear();
  memory.forget();
  playlists.forget();
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
        <button
          bind:this={sortButton}
          class="sort"
          type="button"
          popovertarget="library-sort-menu"
          aria-label="Sort by {SORT_LABELS[order]}"
        >
          <span class="sort-label">Sort:</span>
          {SORT_LABELS[order]}
          <Icon name="chevron-down" size={16} />
        </button>
        <div
          bind:this={sortMenu}
          id="library-sort-menu"
          class="sort-menu"
          popover="auto"
          role="menu"
          ontoggle={(e) =>
            e.newState === 'open' && sortButton && sortMenu && placeMenu(sortButton, sortMenu)}
        >
          {#each Object.entries(SORT_LABELS) as [value, label] (value)}
            <button
              type="button"
              role="menuitemradio"
              aria-checked={order === value}
              onclick={() => {
                setOrder(value as SortOrder);
                sortMenu?.hidePopover();
              }}
            >
              <span class="check" aria-hidden="true">{order === value ? '✓' : ''}</span>{label}
            </button>
          {/each}
        </div>
      </div>
      <button class="clear" type="button" onclick={clearLibrary}>Clear library</button>
    </div>
  </div>

  <!-- Phones have no sidebar, so playlists show here as a row of chips. -->
  <nav class="playlist-chips" aria-label="Playlists">
    {#each playlists.list as playlist (playlist.id)}
      <a href={playlistHref(playlist.id)}>{playlist.name}</a>
    {/each}
    <button type="button" onclick={newPlaylist}>+ New playlist</button>
  </nav>

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
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-height: 40px;
  padding: 0 var(--space-3) 0 var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text);
  font-size: var(--text-sm);
  font-weight: 600;
}

.sort:hover {
  background: var(--surface-strong);
}

.sort-label {
  color: var(--text-muted);
  font-weight: 500;
}

.playlist-chips {
  display: flex;
  gap: var(--space-2);
  padding-bottom: var(--space-4);
  overflow-x: auto;
  scrollbar-width: none;
}

.playlist-chips a,
.playlist-chips button {
  flex: none;
  display: grid;
  place-items: center;
  min-height: 36px;
  padding: 0 var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text);
  font-size: var(--text-sm);
  font-weight: 550;
  text-decoration: none;
}

.playlist-chips button {
  background: none;
  color: var(--text-muted);
}

/* Desktop lists playlists in the sidebar instead. */
@media (min-width: 1100px) {
  .playlist-chips {
    display: none;
  }
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
.sort-menu {
  position: fixed;
  inset: auto;
  width: 13rem;
  margin: 0;
  padding: var(--space-1);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--sky-top) 94%, var(--text));
  box-shadow: 0 16px 40px -16px rgb(0 0 0 / 0.45);
  color: var(--text);
}

.sort-menu button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  min-height: 40px;
  padding: 0 var(--space-3);
  border: 0;
  border-radius: 8px;
  background: none;
  font-weight: 550;
  text-align: start;
}

.sort-menu button:hover,
.sort-menu button:focus-visible {
  background: var(--surface-strong);
}

.check {
  width: 1rem;
  color: var(--accent);
  font-weight: 700;
}
</style>
