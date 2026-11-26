<script lang="ts">
import { discover } from '$lib/discover/discover.svelte';
import { player } from '$lib/player/player.svelte';
import Button from './Button.svelte';
import Icon from './Icon.svelte';
import TrackList from './TrackList.svelte';

let query = $state('');

// Fetch on open, and again whenever the sky's mood changes.
$effect(() => {
  void discover.mood.moods;
  void discover.refresh();
});

const moodWords = $derived(discover.mood.moods.join(', ').toLowerCase());

function playAll(ids: string[], shuffle = false) {
  if (!ids.length) return;
  if (shuffle) void player.shuffleAll(ids);
  else void player.playInOrder(ids);
}
</script>

<section aria-labelledby="discover-title">
  <div class="head">
    <div>
      <h2 id="discover-title" class="title">Discover</h2>
      <p class="meta">Free music from independent artists on Audius.</p>
    </div>
    <search>
      <form
        class="search"
        onsubmit={(e) => {
          e.preventDefault();
          void discover.search(query);
        }}
      >
        <label class="visually-hidden" for="discover-search">Search songs and artists</label>
        <input
          id="discover-search"
          type="search"
          bind:value={query}
          placeholder="Search songs and artists"
          enterkeyhint="search"
          oninput={() => {
            if (!query.trim()) discover.results = null;
          }}
        >
        <Button
          variant="icon"
          icon="search"
          type="submit"
          aria-label="Search"
          disabled={discover.searching}
        />
      </form>
    </search>
  </div>

  {#if discover.results}
    <section class="block" aria-labelledby="results-title">
      <div class="block-head">
        <h3 id="results-title">Results for “{query.trim()}”</h3>
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
      <p class="note">Finding songs for your sky…</p>
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
      <p class="note">Loading what people are playing…</p>
    {:else if discover.trendingStatus === 'error'}
      <p class="note">Couldn’t reach Audius. Check your connection and open Discover again.</p>
    {:else}
      <TrackList tracks={discover.trending} />
    {/if}
  </section>

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

.search {
  display: flex;
  gap: var(--space-2);
  width: min(100%, 22rem);
}

.search input {
  flex: 1;
  min-width: 0;
  min-height: 44px;
  padding: 0 var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--surface);
}

.search input::placeholder {
  color: var(--text-muted);
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

.credit a {
  color: var(--text);
}
</style>
