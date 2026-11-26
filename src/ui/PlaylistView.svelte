<script lang="ts">
import { formatLength } from '$lib/format';
import { library } from '$lib/library/library.svelte';
import type { Track } from '$lib/library/types';
import { player } from '$lib/player/player.svelte';
import { playlists } from '$lib/playlists/playlists.svelte';
import { toast } from '$lib/toast.svelte';
import { view } from '$lib/view.svelte';
import Button from './Button.svelte';
import Cover from './Cover.svelte';
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
let draft = $state('');

function startRename() {
  draft = playlist?.name ?? '';
  editing = true;
}

function finishRename() {
  if (playlist && editing) void playlists.rename(playlist.id, draft);
  editing = false;
}

function focusAndSelect(node: HTMLInputElement) {
  node.focus();
  node.select();
}

function deletePlaylist() {
  if (!playlist) return;
  if (!confirm(`Delete “${playlist.name}”? The songs stay in your library.`)) return;
  void playlists.delete(playlist.id);
  toast.show(`Deleted ${playlist.name}.`);
  location.hash = '#library';
}

function removeSong(track: Track) {
  if (!playlist) return;
  void playlists.remove(playlist.id, track.id);
  toast.show(`Removed ${track.title} from ${playlist.name}.`);
}
</script>

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
          <span class="blank"></span>
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
          {tracks.length}
          {tracks.length === 1 ? 'song' : 'songs'}{length ? `, ${formatLength(length)}` : ''}
        </p>
        <div class="actions">
          <Button
            variant="primary"
            icon="play"
            disabled={!ids.length}
            onclick={() => player.playList(ids)}
            >Play</Button
          >
          <Button icon="shuffle" disabled={ids.length < 2} onclick={() => player.shuffleAll(ids)}
            >Shuffle</Button
          >
          <button class="quiet" type="button" onclick={startRename}>Rename</button>
          <button class="quiet" type="button" onclick={deletePlaylist}>Delete playlist</button>
        </div>
      </div>
    </div>

    {#if tracks.length}
      <TrackList {tracks} onremove={removeSong} removeLabel="Remove from this playlist" />
    {:else}
      <p class="empty">
        No songs yet. Use “Add to playlist” in any song’s ⋯ menu, in your
        <a href="#library">library</a> or in <a href="#discover">Discover</a>.
      </p>
    {/if}
  </section>
{:else}
  <p class="empty">
    This playlist doesn’t exist any more. <a href="#library">Back to your library</a>
  </p>
{/if}

<style>
.playlist {
  display: grid;
  gap: var(--space-6);
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
  display: block;
  width: 100%;
  height: 100%;
  background: linear-gradient(160deg, var(--sky-top), var(--sky-horizon));
}

.about {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
}

.kind,
.meta,
.empty {
  color: var(--text-muted);
}

.kind {
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

.quiet {
  min-height: 44px;
  padding: 0 var(--space-3);
  border: 0;
  background: none;
  color: var(--text-muted);
  font-size: var(--text-sm);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.quiet:hover {
  color: var(--text);
}

.empty {
  padding: var(--space-8) 0;
}

.empty a {
  color: var(--text);
}

@media (max-width: 720px) {
  .name {
    font-size: var(--text-2xl);
  }
}
</style>
