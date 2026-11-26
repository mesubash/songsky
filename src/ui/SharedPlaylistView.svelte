<script lang="ts">
import { AUDIUS_PREFIX, tracksByIds } from '$lib/discover/audius';
import { discover } from '$lib/discover/discover.svelte';
import { JAMENDO_PREFIX, jamendoTracks } from '$lib/discover/jamendo';
import { formatLength } from '$lib/format';
import { library } from '$lib/library/library.svelte';
import type { Track } from '$lib/library/types';
import { player } from '$lib/player/player.svelte';
import { playlists } from '$lib/playlists/playlists.svelte';
import { prefs } from '$lib/prefs.svelte';
import { decodeShare } from '$lib/share/link';
import { toast } from '$lib/toast.svelte';
import { playlistHref, view } from '$lib/view.svelte';
import Button from './Button.svelte';
import Cover from './Cover.svelte';
import Icon from './Icon.svelte';
import TrackList from './TrackList.svelte';
import TrackSkeleton from './TrackSkeleton.svelte';

/** A playlist someone sent as a link: its songs are looked up again from Audius and Jamendo. */

const shared = $derived(decodeShare(view.sharedData));
let tracks = $state<Track[]>([]);
let status = $state<'loading' | 'idle' | 'error'>('loading');

$effect(() => {
  const list = shared;
  if (!list) return;
  let alive = true;
  status = 'loading';
  const audius = list.ids.filter((id) => id.startsWith(AUDIUS_PREFIX));
  const jamendo = list.ids.filter((id) => id.startsWith(JAMENDO_PREFIX));
  void Promise.allSettled([
    tracksByIds(audius.map((id) => id.slice(AUDIUS_PREFIX.length))),
    jamendo.length
      ? jamendoTracks({ ids: jamendo.map((id) => id.slice(JAMENDO_PREFIX.length)) }, 50)
      : Promise.resolve([]),
  ]).then((results) => {
    if (!alive) return;
    if (results.every((r) => r.status === 'rejected')) {
      status = 'error';
      return;
    }
    // Keep the sender's order; songs that no longer exist are left out.
    const found = new Map(
      results.flatMap((r) => (r.status === 'fulfilled' ? r.value : [])).map((t) => [t.id, t]),
    );
    tracks = list.ids.flatMap((id) => found.get(id) ?? []);
    library.rememberStreams(tracks);
    status = 'idle';
  });
  return () => {
    alive = false;
  };
});

const ids = $derived(tracks.map((t) => t.id));
const length = $derived(tracks.reduce((sum, t) => sum + (t.duration || 0), 0));
const covers = $derived(tracks.filter((t) => t.artworkUrl).slice(0, 4));
const missing = $derived(shared && status === 'idle' ? shared.ids.length - tracks.length : 0);
let saving = $state(false);

async function save() {
  if (!shared || !tracks.length) return;
  saving = true;
  try {
    for (const track of tracks) if (!library.isSaved(track.id)) await library.save(track);
    const mine = await playlists.create(ids, shared.name);
    toast.show(`Saved “${mine.name}” to your playlists.`);
    location.hash = playlistHref(mine.id);
  } finally {
    saving = false;
  }
}
</script>

{#if !shared}
  <section class="empty">
    <h2>This link doesn’t open a playlist</h2>
    <p>It may have been cut short when it was copied. Ask for the link again.</p>
    <a href="#library">Go to your library</a>
  </section>
{:else if !prefs.onlineMusic}
  <section class="empty">
    <h2>{shared.name}</h2>
    <p>
      This playlist is online music, and Songsky is set to play only your music. Turn on Online
      music in <a href="#settings/music">Settings, Your music</a> to listen.
    </p>
  </section>
{:else}
  <section class="shared" aria-labelledby="shared-title">
    <div class="head">
      <div class="art" class:grid={covers.length >= 4} aria-hidden="true">
        {#if covers.length >= 4}
          {#each covers as track (track.id)}
            <Cover coverId={null} artworkUrl={track.artworkUrl} size={96} fluid />
          {/each}
        {:else if covers[0]}
          <Cover coverId={null} artworkUrl={covers[0].artworkUrl} size={192} fluid />
        {:else}
          <span class="blank"><Icon name="music" size={48} /></span>
        {/if}
      </div>
      <div class="about">
        <p class="kind">Shared playlist</p>
        <h2 id="shared-title">{shared.name}</h2>
        <p class="meta">
          {#if status === 'loading'}
            Finding the songs…
          {:else}
            {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}{length
              ? `, ${formatLength(length)}`
              : ''}
          {/if}
        </p>
        <div class="actions">
          <Button
            variant="primary"
            icon="play"
            disabled={!ids.length}
            onclick={() => player.playInOrder(ids)}
            >Play</Button
          >
          <Button icon="shuffle" disabled={ids.length < 2} onclick={() => player.shuffleAll(ids)}
            >Shuffle</Button
          >
          <Button icon="plus" disabled={!ids.length || saving} onclick={save}
            >Save to my playlists</Button
          >
        </div>
      </div>
    </div>

    {#if status === 'loading'}
      <TrackSkeleton label="Finding the songs" />
    {:else if status === 'error'}
      <p class="note">Couldn’t reach the music library. Check your connection and try again.</p>
    {:else if tracks.length}
      <TrackList {tracks} />
      {#if missing}
        <p class="note">
          {missing}
          {missing === 1 ? 'song isn’t' : 'songs aren’t'} available any more, so
          {missing === 1 ? 'it was' : 'they were'} left out.
        </p>
      {/if}
      {#if !discover.useJamendo && shared.ids.some((id) => id.startsWith(JAMENDO_PREFIX))}
        <p class="note">Some songs are from Jamendo, which is turned off in Settings.</p>
      {/if}
    {:else}
      <p class="note">None of these songs are available any more.</p>
    {/if}
  </section>
{/if}

<style>
.shared {
  display: grid;
  gap: var(--space-6);
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

.kind {
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-weight: 600;
}

h2 {
  font-size: var(--text-3xl);
  letter-spacing: -0.03em;
  line-height: 1.05;
  overflow-wrap: anywhere;
}

.meta,
.note,
.empty p {
  color: var(--text-muted);
}

.note {
  font-size: var(--text-sm);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding-top: var(--space-2);
}

.empty {
  display: grid;
  gap: var(--space-3);
  max-width: 34rem;
  padding: var(--space-12) 0;
}

.empty a {
  color: var(--text);
  font-weight: 600;
}

@media (max-width: 720px) {
  h2 {
    font-size: var(--text-2xl);
  }
}
</style>
