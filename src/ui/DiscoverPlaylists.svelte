<script lang="ts">
import { type AudiusPlaylist, playlistTracks, trendingPlaylists } from '$lib/discover/audius';
import { library } from '$lib/library/library.svelte';
import type { Track } from '$lib/library/types';
import { player } from '$lib/player/player.svelte';
import { playlists as myPlaylists } from '$lib/playlists/playlists.svelte';
import { toast } from '$lib/toast.svelte';
import { playlistHref } from '$lib/view.svelte';
import Button from './Button.svelte';
import Cover from './Cover.svelte';
import Icon from './Icon.svelte';
import TrackList from './TrackList.svelte';
import TrackSkeleton from './TrackSkeleton.svelte';

/** Trending playlists on Audius, as covers; opening one lists its songs. */

let list = $state<AudiusPlaylist[]>([]);
let status = $state<'idle' | 'loading' | 'error'>('loading');
let open = $state<AudiusPlaylist | null>(null);
let tracks = $state<Track[]>([]);
let tracksStatus = $state<'idle' | 'loading' | 'error'>('idle');

$effect(() => {
  let alive = true;
  trendingPlaylists()
    .then((found) => {
      if (!alive) return;
      list = found;
      status = 'idle';
    })
    .catch(() => {
      if (alive) status = 'error';
    });
  return () => {
    alive = false;
  };
});

async function show(playlist: AudiusPlaylist) {
  open = playlist;
  tracks = [];
  tracksStatus = 'loading';
  scrollTo({ top: 0, behavior: 'smooth' });
  try {
    const found = await playlistTracks(playlist.id);
    if (open?.id !== playlist.id) return;
    library.rememberStreams(found);
    tracks = found;
    tracksStatus = 'idle';
  } catch {
    tracksStatus = 'error';
  }
}

/** Copies the playlist into your own playlists, saving its songs to your library. */
async function saveAsMine() {
  if (!open || !tracks.length) return;
  for (const track of tracks) if (!library.isSaved(track.id)) await library.save(track);
  const mine = await myPlaylists.create(
    tracks.map((t) => t.id),
    open.name,
  );
  toast.show(`Saved “${mine.name}” to your playlists.`);
  location.hash = playlistHref(mine.id);
}
</script>

{#if open}
  <section class="block" aria-labelledby="audius-playlist-title">
    <button class="back" type="button" onclick={() => (open = null)}>‹ All playlists</button>
    <div class="head">
      <div class="art">
        <Cover coverId={null} artworkUrl={open.artworkUrl} size={176} fluid />
      </div>
      <div class="about">
        <p class="kind">Playlist on Audius</p>
        <h3 id="audius-playlist-title">{open.name}</h3>
        <p class="meta">
          By {open.owner}, {open.trackCount} {open.trackCount === 1 ? 'song' : 'songs'}
        </p>
        <div class="actions">
          <Button
            variant="primary"
            icon="play"
            disabled={!tracks.length}
            onclick={() => player.playInOrder(tracks.map((t) => t.id))}
            >Play</Button
          >
          <Button
            icon="shuffle"
            disabled={tracks.length < 2}
            onclick={() => player.shuffleAll(tracks.map((t) => t.id))}
            >Shuffle</Button
          >
          <Button icon="plus" disabled={!tracks.length} onclick={saveAsMine}
            >Save as my playlist</Button
          >
          {#if open.link}
            <a class="external" href={open.link} target="_blank" rel="noopener noreferrer"
              >Open on Audius <Icon name="external" size={14} /></a
            >
          {/if}
        </div>
      </div>
    </div>
    {#if tracksStatus === 'loading'}
      <TrackSkeleton label="Loading songs" />
    {:else if tracksStatus === 'error'}
      <p class="note">Couldn’t load this playlist. Check your connection and try again.</p>
    {:else if tracks.length}
      <TrackList {tracks} />
    {:else}
      <p class="note">None of this playlist’s songs can be played for free.</p>
    {/if}
  </section>
{:else if status === 'loading'}
  <ul class="grid" aria-busy="true">
    {#each Array.from({ length: 8 }, (_, i) => i) as i (i)}
      <li class="placeholder" aria-hidden="true"><span></span></li>
    {/each}
  </ul>
{:else if status === 'error'}
  <p class="note">Couldn’t reach Audius. Check your connection and open Discover again.</p>
{:else}
  <ul class="grid">
    {#each list as playlist (playlist.id)}
      <li>
        <button class="card" type="button" onclick={() => show(playlist)}>
          <span class="card-art">
            <Cover coverId={null} artworkUrl={playlist.artworkUrl} size={240} fluid />
          </span>
          <span class="card-name">{playlist.name}</span>
          <span class="card-meta">{playlist.owner}, {playlist.trackCount} songs</span>
        </button>
      </li>
    {/each}
  </ul>
{/if}

<style>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: var(--space-6) var(--space-4);
  margin: 0;
  padding: var(--space-2) 0 var(--space-8);
  list-style: none;
}

.card {
  display: grid;
  gap: var(--space-1);
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  text-align: start;
}

.card-art {
  display: block;
  margin-bottom: var(--space-2);
  border-radius: var(--radius-md);
  box-shadow: 0 18px 40px -22px rgb(0 0 0 / 0.6);
  transition: transform 200ms var(--ease-out);
}

.card:hover .card-art {
  transform: translateY(-4px);
}

.card-art :global(.cover) {
  border-radius: var(--radius-md);
}

.card-name,
.card-meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-name {
  font-weight: 600;
}

.card-meta,
.meta,
.kind,
.note {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.placeholder span {
  display: block;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  background: var(--surface-strong);
  animation: pulse 1.4s ease-in-out infinite alternate;
}

.block {
  display: grid;
  gap: var(--space-6);
  padding-bottom: var(--space-8);
}

.back {
  width: fit-content;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--text);
  font-weight: 600;
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-6);
}

.art {
  width: clamp(8rem, 16vw, 11rem);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 18px 40px -22px rgb(0 0 0 / 0.6);
}

.about {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
}

.kind {
  font-weight: 600;
}

h3 {
  font-size: var(--text-2xl);
  letter-spacing: -0.02em;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  padding-top: var(--space-2);
}

.external {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-height: 44px;
  padding: 0 var(--space-2);
  color: var(--text);
  font-size: var(--text-sm);
  font-weight: 600;
}

@keyframes pulse {
  from {
    opacity: 0.45;
  }
}
</style>
