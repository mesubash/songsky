<script lang="ts">
import { discover } from '$lib/discover/discover.svelte';
import { player } from '$lib/player/player.svelte';
import { prefs } from '$lib/prefs.svelte';
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

// Fetch on open, and again whenever the sky's mood or the music sources change.
$effect(() => {
  void discover.mood.moods;
  void prefs.sources.audius;
  void prefs.sources.jamendo;
  void discover.refresh();
});

/** Each tab and whether it has something to show with the sources that are on. */
const TABS: { id: DiscoverTab; label: string; icon: IconName; on: () => boolean }[] = [
  { id: 'for-you', label: 'For you', icon: 'sun', on: () => discover.hasSongs },
  { id: 'genres', label: 'Genres', icon: 'disc', on: () => discover.hasSongs },
  { id: 'playlists', label: 'Playlists', icon: 'music', on: () => discover.useAudius },
  { id: 'radio', label: 'Radio', icon: 'volume', on: () => prefs.sources.radio },
];

/** Tabs with a source turned on (Settings > Music sources). */
const tabs = $derived(TABS.filter((t) => t.on()));

/** Song sources in use, credited at the bottom of the page. */
const SOURCES = [
  { name: 'Audius', url: 'https://audius.co', on: () => discover.useAudius },
  { name: 'Jamendo', url: 'https://www.jamendo.com', on: () => discover.useJamendo },
];
/** The open tab, or the first one left when the open tab's source was turned off. */
const tab = $derived(tabs.find((t) => t.id === view.discoverTab)?.id ?? tabs[0]?.id);
const tabHref = (id: DiscoverTab) => (id === tabs[0]?.id ? '#discover' : `#discover/${id}`);

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
      <p class="meta">Free music from independent artists.</p>
    </div>
    {#if discover.hasSongs}
      <div class="page-search"><SearchBox id="discover-search" /></div>
    {/if}
  </div>

  <nav class="tabs" aria-label="Discover">
    {#each tabs as t (t.id)}
      <a href={tabHref(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
        <Icon name={t.icon} size={16} />{t.label}
      </a>
    {/each}
  </nav>

  {#if !tab}
    <p class="note">
      All music sources are off. Turn one on in
      <a href="#settings/sources">Settings, Music sources</a>.
    </p>
  {:else if tab === 'genres'}
    <DiscoverGenres />
  {:else if tab === 'playlists'}
    <DiscoverPlaylists />
  {:else if tab === 'radio'}
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
        <p class="note">Couldn’t reach the music library. Check your connection and try again.</p>
      {:else}
        <TrackList tracks={discover.forSky} />
      {/if}
    </section>

    {#if discover.useAudius}
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
          <p class="note">Couldn’t reach the music library. Check your connection and try again.</p>
        {:else}
          <TrackList tracks={discover.trending} />
        {/if}
      </section>
    {/if}

    {#if discover.useJamendo && discover.useAudius}
      <section class="block" aria-labelledby="cc-title">
        <div class="block-head">
          <div>
            <h3 id="cc-title">Free to share</h3>
            <p class="meta">Popular Creative Commons songs this month.</p>
          </div>
          <Button
            icon="shuffle"
            disabled={!discover.jamendoPicks.length}
            onclick={() =>
              playAll(
                discover.jamendoPicks.map((t) => t.id),
                true,
              )}
          >
            Shuffle
          </Button>
        </div>
        {#if discover.jamendoStatus === 'loading' && !discover.jamendoPicks.length}
          <TrackSkeleton label="Loading Creative Commons songs" />
        {:else if discover.jamendoStatus === 'error'}
          <p class="note">Couldn’t load these songs. Check your connection and try again.</p>
        {:else}
          <TrackList tracks={discover.jamendoPicks} />
        {/if}
      </section>
    {/if}
  {/if}

  {#if discover.hasSongs && tab !== 'radio'}
    <p class="credit">
      <Icon name="music" size={16} />
      Songs stream from
      {#each SOURCES.filter((x) => x.on()) as source, i (source.name)}
        {i ? ' and ' : ''}<a href={source.url} target="_blank" rel="noopener noreferrer"
          >{source.name}</a
        >
      {/each}
      and belong to their artists. Open a song’s page to follow and support them.
    </p>
  {/if}
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
