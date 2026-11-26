<script lang="ts">
import { analyzer } from '$lib/analysis/analyzer.svelte';
import { ask } from '$lib/confirm.svelte';
import { formatLength } from '$lib/format';
import { browse, SORT_LABELS, type SortOrder } from '$lib/library/browse';
import { library } from '$lib/library/library.svelte';
import type { Track } from '$lib/library/types';
import { memory } from '$lib/memory/memory.svelte';
import { player } from '$lib/player/player.svelte';
import { playlists } from '$lib/playlists/playlists.svelte';
import { prefs } from '$lib/prefs.svelte';
import { playlistHref } from '$lib/view.svelte';
import Icon, { type IconName } from './Icon.svelte';
import LibraryActions from './LibraryActions.svelte';
import { placeMenu } from './menu';
import TrackList from './TrackList.svelte';

const count = $derived(library.visibleTracks.length);

const SORT_KEY = 'songsky:library-sort';
let sortButton = $state<HTMLButtonElement>();
let sortMenu = $state<HTMLDivElement>();
let query = $state('');
let order = $state<SortOrder>(
  (Object.keys(SORT_LABELS) as SortOrder[]).find((o) => o === localStorage.getItem(SORT_KEY)) ??
    'artist',
);
/** Where songs came from: each music folder, files added one by one, and saved online songs. */
type Group = { id: string; label: string; icon: IconName; count: number };
const groups = $derived.by((): Group[] => {
  const tracks = library.visibleTracks;
  const list: Group[] = [];
  if (prefs.localMusic) {
    for (const folder of library.folders) {
      list.push({
        id: `folder:${folder}`,
        label: folder,
        icon: 'folder',
        count: tracks.filter((t) => t.folder === folder).length,
      });
    }
  }
  const files = tracks.filter((t) => t.source !== 'stream' && !t.folder).length;
  if (files) list.push({ id: 'files', label: 'Added files', icon: 'music', count: files });
  const online = tracks.filter((t) => t.source === 'stream').length;
  if (online) list.push({ id: 'online', label: 'Saved online', icon: 'heart', count: online });
  return list;
});

let group = $state('all');
/** The chosen group, or All when it no longer exists (e.g. its folder was removed). */
const active = $derived(groups.some((g) => g.id === group) ? group : 'all');
const inGroup = (t: Track) =>
  active === 'all' ||
  (active === 'files'
    ? t.source !== 'stream' && !t.folder
    : active === 'online'
      ? t.source === 'stream'
      : `folder:${t.folder}` === active);
const grouped = $derived(library.visibleTracks.filter(inGroup));
const shown = $derived(browse(grouped, query, order));
/** Show the chips when there's a choice to make, or a folder can be added. */
const showGroups = $derived(groups.length > 1 || (prefs.localMusic && library.canPickFolder));

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
      <LibraryActions tracks={grouped} />
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

  {#if showGroups}
    <nav class="groups" aria-label="Show songs from">
      <button
        type="button"
        class="group"
        aria-pressed={active === 'all'}
        onclick={() => (group = 'all')}
      >
        All songs <span class="n">{library.visibleTracks.length}</span>
      </button>
      {#each groups as g (g.id)}
        <button
          type="button"
          class="group"
          aria-pressed={active === g.id}
          onclick={() => (group = g.id)}
        >
          <Icon name={g.icon} size={15} />{g.label} <span class="n">{g.count}</span>
        </button>
      {/each}
      {#if prefs.localMusic && library.canPickFolder}
        <button type="button" class="group add" onclick={() => library.addFolder()}>
          <Icon name="plus" size={15} />Add folder
        </button>
      {/if}
      {#if library.folders.length && prefs.localMusic}
        <a class="manage" href="#settings/music">Manage folders</a>
      {/if}
    </nav>
  {/if}

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
      {#if query}
        No songs match “{query}”.
        <button type="button" onclick={() => (query = '')}>Show all songs</button>
      {:else}
        No songs here yet. Rescan the folder from
        <a href="#settings/music">Settings, Your music</a>, or
        <button type="button" onclick={() => (group = 'all')}>show all songs</button>.
      {/if}
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

/* Filter chips: where songs came from. The chosen one is filled. */
.groups {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  padding-bottom: var(--space-4);
}

.group {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 36px;
  padding: 0 var(--space-3) 0 var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text);
  font-size: var(--text-sm);
  font-weight: 600;
}

.group:hover {
  background: var(--surface-strong);
}

.group[aria-pressed="true"] {
  border-color: transparent;
  background: var(--text);
  color: var(--sky-top);
}

.n {
  min-width: 1.5rem;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, currentColor 14%, transparent);
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.group.add {
  border-style: dashed;
  background: none;
  color: var(--text-muted);
}

.manage {
  margin-left: var(--space-2);
  color: var(--text-muted);
  font-size: var(--text-sm);
  text-underline-offset: 3px;
}

.no-match a {
  color: var(--text);
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
