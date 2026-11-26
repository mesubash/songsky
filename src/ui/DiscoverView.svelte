<script lang="ts">
import { discover } from '$lib/discover/discover.svelte';
import { player } from '$lib/player/player.svelte';
import { type DiscoverTab, view } from '$lib/view.svelte';
import Button from './Button.svelte';
import DiscoverGenres from './DiscoverGenres.svelte';
import DiscoverPlaylists from './DiscoverPlaylists.svelte';
import DiscoverRadio from './DiscoverRadio.svelte';
import type { IconName } from './Icon.svelte';
import Icon from './Icon.svelte';
import SearchBox from './SearchBox.svelte';
import TrackList from './TrackList.svelte';
import TrackSkeleton from './TrackSkeleton.svelte';

// Fetch on open, and again whenever the sky's mood changes.
$effect(() => {
  void discover.mood.moods;
  void discover.refresh();
});

const TABS: { id: DiscoverTab; label: string; icon: IconName }[] = [
  { id: 'for-you', label: 'For you', icon: 'sun' },
  { id: 'genres', label: 'Genres', icon: 'disc' },
  { id: 'playlists', label: 'Playlists', icon: 'music' },
  { id: 'radio', label: 'Radio', icon: 'volume' },
];

const moodWords = $derived(discover.mood.moods.join(', ').toLowerCase());

function playAll(ids: string[], shuffle = false) {
  if (!ids.length) return;
  if (shuffle) void player.shuffleAll(ids);
  else void player.playInOrder(ids);
}
</script>

<section aria-labelledby="discover-title">
  <div class="head">
    <div class="desktop-title">
      <h2 id="discover-title" class="title">Discover</h2>
      <p class="meta">Free music from independent artists on Audius.</p>
    </div>
    <div class="page-search"><SearchBox id="discover-search" /></div>
  </div>

  <nav class="tabs" aria-label="Discover">
    {#each TABS as tab (tab.id)}
      <a
        href={tab.id === 'for-you' ? '#discover' : `#discover/${tab.id}`}
        aria-current={view.discoverTab === tab.id ? 'page' : undefined}
      >
        <Icon name={tab.icon} size={16} />{tab.label}
      </a>
    {/each}
  </nav>

  {#if view.discoverTab === 'genres'}
    <DiscoverGenres />
  {:else if view.discoverTab === 'playlists'}
    <DiscoverPlaylists />
  {:else if view.discoverTab === 'radio'}
    <DiscoverRadio />
  {:else}
    {#if discover.results}
      <section class="block" aria-labelledby="results-title">
        <div class="block-head">
          <h3 id="results-title">Results for “{discover.searched}”</h3>
        </div>
        {#if discover.results.length}
          <TrackList tracks={discover.results} />
        {:else}
          <p class="note">No songs found. Try another spelling, or search for an artist.</p>
        {/if}
      </section>
    {:else if discover.searchError}
      <p class="note">Search isn’t available right now. Check your connection and try again.</p>
    {/if}

    <section class="block" aria-labelledby="sky-title">
      <div class="block-head">
        <div>
          <h3 id="sky-title">{discover.mood.title}</h3>
          <p class="meta">Songs that feel {moodWords}. They change with your sky.</p>
        </div>
        <Button
          variant="primary"
          icon="play"
          disabled={!discover.forSky.length}
          onclick={() => playAll(discover.forSky.map((t) => t.id))}
        >
          Play all
        </Button>
      </div>
      {#if discover.skyStatus === 'loading' && !discover.forSky.length}
        <TrackSkeleton label="Finding songs for your sky" />
      {:else if discover.skyStatus === 'error'}
        <p class="note">Couldn’t reach Audius. Check your connection and open Discover again.</p>
      {:else}
        <TrackList tracks={discover.forSky} />
      {/if}
    </section>

    <section class="block" aria-labelledby="trending-title">
      <div class="block-head">
        <h3 id="trending-title">Trending this week</h3>
        <Button
          icon="shuffle"
          disabled={!discover.trending.length}
          onclick={() =>
            playAll(
              discover.trending.map((t) => t.id),
              true,
            )}
        >
          Shuffle
        </Button>
      </div>
      {#if discover.trendingStatus === 'loading' && !discover.trending.length}
        <TrackSkeleton label="Loading trending songs" />
      {:else if discover.trendingStatus === 'error'}
        <p class="note">Couldn’t reach Audius. Check your connection and open Discover again.</p>
      {:else}
        <TrackList tracks={discover.trending} />
      {/if}
    </section>
  {/if}

  <p class="credit">
    <Icon name="music" size={16} />
    Songs stream from
    <a href="https://audius.co" target="_blank" rel="noopener noreferrer">Audius</a>
    and belong to their artists. Open a song’s page to follow and support them.
  </p>
</section>

<style>
.head,
.block-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
}

.head {
  padding-block: var(--space-8) var(--space-4);
}

.title {
  font-size: var(--text-2xl);
  letter-spacing: -0.02em;
}

h3 {
  font-size: var(--text-lg);
}

.meta,
.note,
.credit {
  color: var(--text-muted);
}

.credit a {
  color: var(--text);
}

/* Pill tabs under the page title; they scroll sideways on narrow phones. */
.tabs {
  display: flex;
  gap: var(--space-2);
  padding-block: var(--space-2) var(--space-4);
  overflow-x: auto;
  scrollbar-width: none;
}

.tabs a {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--space-2);
  min-height: 40px;
  padding: 0 var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text);
  font-weight: 600;
  text-decoration: none;
}

.tabs a:hover {
  background: var(--surface-strong);
}

.tabs a[aria-current="page"] {
  border-color: transparent;
  background: var(--text);
  color: var(--sky-top);
}

.block {
  display: grid;
  gap: var(--space-3);
  padding-top: var(--space-8);
}

.note {
  padding: var(--space-4) var(--space-3);
}

.credit {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  padding-block: var(--space-12) var(--space-4);
  font-size: var(--text-sm);
}

/* Desktop has the title and search in the top bar, so this row shrinks away there. */
@media (min-width: 1100px) {
  .page-search {
    display: none;
  }

  .head {
    padding-block: 0;
  }
}
</style>
