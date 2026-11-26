<script lang="ts">
import { searchTracks } from '$lib/discover/audius';
import { formatLength, formatTime } from '$lib/format';
import { browse } from '$lib/library/browse';
import { library } from '$lib/library/library.svelte';
import type { Track } from '$lib/library/types';
import { player } from '$lib/player/player.svelte';
import { playlists } from '$lib/playlists/playlists.svelte';
import { toast } from '$lib/toast.svelte';
import { view } from '$lib/view.svelte';
import Button from './Button.svelte';
import Cover from './Cover.svelte';
import Icon from './Icon.svelte';
import PlaylistMenu from './PlaylistMenu.svelte';
import TrackList from './TrackList.svelte';

const playlist = $derived(view.playlistId ? playlists.byId(view.playlistId) : undefined);
/** Songs still in the library (a removed Discover song drops out quietly). */
const tracks = $derived(
  (playlist?.trackIds ?? []).flatMap((id) => {
    const track = library.byId.get(id);
    return track ? [track] : [];
  }),
);
const ids = $derived(tracks.map((t) => t.id));
const length = $derived(tracks.reduce((sum, t) => sum + (t.duration || 0), 0));
/** Up to four covers make the playlist's picture. */
const covers = $derived(tracks.filter((t) => t.coverId || t.artworkUrl).slice(0, 4));

let editing = $state(false);
/** The song finder is open (it's always open while the playlist is empty). */
let adding = $state(false);

function focusWhenAdding(node: HTMLInputElement) {
  if (adding) node.focus();
}
let draft = $state('');

function startRename() {
  draft = playlist?.name ?? '';
  editing = true;
}

// "Rename" from a ⋯ menu opens this page with the name ready to edit.
$effect(() => {
  if (playlist && playlists.renameRequest === playlist.id) {
    playlists.renameRequest = null;
    startRename();
  }
});

function finishRename() {
  if (playlist && editing) void playlists.rename(playlist.id, draft);
  editing = false;
}

function focusAndSelect(node: HTMLInputElement) {
  node.focus();
  node.select();
}

function removeSong(track: Track) {
  if (!playlist) return;
  void playlists.remove(playlist.id, track.id);
  toast.show(`Removed ${track.title} from ${playlist.name}.`);
}

/* Adding songs: your library matches right away, Audius after a short pause in typing. */
let query = $state('');
let online = $state<Track[]>([]);
let searchingOnline = $state(false);

const inPlaylist = $derived(new Set(playlist?.trackIds ?? []));
const fromLibrary = $derived(
  (query.trim() ? browse(library.tracks, query, 'artist') : browse(library.tracks, '', 'added'))
    .filter((t) => !inPlaylist.has(t.id))
    .slice(0, 8),
);
const fromAudius = $derived(online.filter((t) => !inPlaylist.has(t.id)).slice(0, 8));

$effect(() => {
  const q = query.trim();
  if (q.length < 2) {
    online = [];
    return;
  }
  searchingOnline = true;
  let alive = true;
  const timer = setTimeout(async () => {
    try {
      const found = await searchTracks(q, 10);
      if (!alive) return;
      library.rememberStreams(found);
      online = found;
    } catch {
      if (alive) online = [];
    } finally {
      if (alive) searchingOnline = false;
    }
  }, 400);
  return () => {
    alive = false;
    clearTimeout(timer);
  };
});

async function add(track: Track) {
  if (!playlist) return;
  if (track.source === 'stream' && !library.isSaved(track.id)) await library.save(track);
  await playlists.add(playlist.id, track.id);
  toast.show(`Added ${track.title}.`);
}
</script>

{#snippet suggestion(track: Track)}
  <li>
    <Cover coverId={track.coverId} artworkUrl={track.artworkUrl} size={40} />
    <span class="s-text">
      <span class="s-title">{track.title}</span>
      <span class="s-artist">{track.artist}</span>
    </span>
    <span class="s-time">{track.duration ? formatTime(track.duration) : ''}</span>
    <button class="add" type="button" aria-label="Add {track.title}" onclick={() => add(track)}>
      <Icon name="plus" size={18} />
    </button>
  </li>
{/snippet}

{#if playlist}
  <section class="playlist" aria-labelledby="playlist-title">
    <div class="head">
      <div class="art" class:grid={covers.length >= 4} aria-hidden="true">
        {#if covers.length >= 4}
          {#each covers as track (track.id)}
            <Cover coverId={track.coverId} artworkUrl={track.artworkUrl} size={96} fluid />
          {/each}
        {:else if covers[0]}
          <Cover coverId={covers[0].coverId} artworkUrl={covers[0].artworkUrl} size={192} fluid />
        {:else}
          <span class="blank"><Icon name="music" size={48} /></span>
        {/if}
      </div>

      <div class="about">
        <p class="kind">Playlist</p>
        {#if editing}
          <form
            onsubmit={(e) => {
              e.preventDefault();
              finishRename();
            }}
          >
            <label class="visually-hidden" for="playlist-name">Playlist name</label>
            <input
              id="playlist-name"
              class="name-input"
              bind:value={draft}
              maxlength="80"
              onblur={finishRename}
              onkeydown={(e) => {
                if (e.key === 'Escape') editing = false;
              }}
              use:focusAndSelect
            >
          </form>
        {:else}
          <h2 id="playlist-title">
            <button class="name" type="button" title="Rename" onclick={startRename}>
              {playlist.name}
            </button>
          </h2>
        {/if}
        <p class="meta">
          {tracks.length
            ? `${tracks.length} ${tracks.length === 1 ? 'song' : 'songs'}${length ? `, ${formatLength(length)}` : ''}`
            : 'Empty for now'}
        </p>
        <div class="actions">
          {#if ids.length}
            <Button variant="primary" icon="play" onclick={() => player.playList(ids)}>Play</Button>
            {#if ids.length > 1}
              <Button icon="shuffle" onclick={() => player.shuffleAll(ids)}>Shuffle</Button>
            {/if}
          {/if}
          {#if tracks.length && !adding}
            <Button icon="plus" onclick={() => (adding = true)}>Add songs</Button>
          {/if}
          <PlaylistMenu {playlist} />
        </div>
      </div>
    </div>

    <!-- Finding songs: shown on an empty playlist, or after pressing Add songs. -->
    {#if !tracks.length || adding}
      <section class="finder" aria-label="Add songs">
        <div class="finder-bar">
          <search class="find">
            <label class="visually-hidden" for="add-search">Find songs to add</label>
            <Icon name="search" size={18} />
            <input
              id="add-search"
              type="search"
              placeholder="Search for songs to add, from your library or Audius"
              autocomplete="off"
              bind:value={query}
              use:focusWhenAdding
            >
          </search>
          {#if tracks.length}
            <Button
              onclick={() => {
                adding = false;
                query = '';
              }}
              >Done</Button
            >
          {/if}
        </div>

        {#if fromLibrary.length}
          <h4>{query.trim() ? 'In your library' : 'Recently added to your library'}</h4>
          <ul class="suggestions">
            {#each fromLibrary as track (track.id)}
              {@render suggestion(track)}
            {/each}
          </ul>
        {/if}

        {#if query.trim().length >= 2}
          <h4>From Audius</h4>
          {#if fromAudius.length}
            <ul class="suggestions">
              {#each fromAudius as track (track.id)}
                {@render suggestion(track)}
              {/each}
            </ul>
          {:else}
            <p class="note">{searchingOnline ? 'Searching…' : 'No songs found on Audius.'}</p>
          {/if}
        {/if}
      </section>
    {/if}

    {#if tracks.length}
      <TrackList {tracks} onremove={removeSong} removeLabel="Remove from this playlist" />
    {/if}
  </section>
{:else}
  <p class="note missing">
    This playlist doesn’t exist any more. <a href="#library">Back to your library</a>
  </p>
{/if}

<style>
.playlist {
  display: grid;
  gap: var(--space-8);
  padding-bottom: var(--space-8);
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-6);
  padding-top: var(--space-8);
}

.art {
  flex: none;
  width: clamp(8rem, 18vw, 12rem);
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--surface-strong);
  box-shadow: 0 18px 40px -22px rgb(0 0 0 / 0.6);
}

.art.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.art :global(.cover) {
  border-radius: 0;
}

.blank {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(160deg, var(--sky-top), var(--sky-horizon));
  color: color-mix(in srgb, var(--text) 45%, transparent);
}

.about {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
}

.kind,
.meta,
.note,
h4,
.s-artist,
.s-time {
  color: var(--text-muted);
}

.kind,
h4 {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
}

.name {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-size: var(--text-3xl);
  letter-spacing: -0.03em;
  line-height: 1.05;
  text-align: start;
  overflow-wrap: anywhere;
  cursor: text;
}

.name-input {
  width: min(100%, 32rem);
  padding: 0 var(--space-2);
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--display-weight);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  padding-top: var(--space-2);
}

/* Finding songs to add: a wide search field with results right under it, no frame. */
.finder {
  display: grid;
  gap: var(--space-3);
}

.finder-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  max-width: 44rem;
}

.find {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--space-3);
  min-height: 52px;
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
  font-size: var(--text-base);
}

h4 {
  padding-top: var(--space-2);
}

.suggestions {
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.suggestions li {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
}

.suggestions li:hover {
  background: var(--surface-strong);
}

.s-text {
  flex: 1;
  display: grid;
  min-width: 0;
}

.s-title,
.s-artist {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-title {
  font-weight: 550;
}

.s-artist,
.s-time,
.note {
  font-size: var(--text-sm);
}

.s-time {
  font-variant-numeric: tabular-nums;
}

.add {
  display: grid;
  flex: none;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: none;
  color: var(--text);
}

.add:hover {
  border-color: transparent;
  background: var(--accent);
  color: var(--on-accent);
}

.missing {
  padding: var(--space-8) 0;
}

.missing a {
  color: var(--text);
}

@media (max-width: 720px) {
  .name {
    font-size: var(--text-2xl);
  }

  .s-time {
    display: none;
  }
}
</style>
