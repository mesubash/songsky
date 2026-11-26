<script lang="ts">
import { discover } from '$lib/discover/discover.svelte';
import { library } from '$lib/library/library.svelte';
import { player } from '$lib/player/player.svelte';
import Button from './Button.svelte';
import TrackList from './TrackList.svelte';
import TrackSkeleton from './TrackSkeleton.svelte';

const PICKS = 6;

// The promise in the headline is real: today's picks load right here, ready to play.
$effect(() => {
  void discover.mood.moods;
  void discover.refresh();
});

const picks = $derived(discover.forSky.slice(0, PICKS));

function playPicks() {
  const ids = discover.forSky.map((t) => t.id);
  if (ids.length) void player.playInOrder(ids);
}
</script>

<section class="home" aria-labelledby="empty-title">
  <div class="intro">
    <h2 id="empty-title" class="headline">Music that follows your sky.</h2>
    <p class="lead">
      Songs picked for your weather right now, free from independent artists. Or bring your own
      music: your files stay on this device, and your library is here next time.
    </p>
    <div class="actions">
      <Button variant="primary" icon="play" disabled={!picks.length} onclick={playPicks}>
        Play songs for your sky
      </Button>
      {#if library.canPickFolder}
        <Button icon="folder" onclick={() => library.addFolder()}>Choose a folder</Button>
      {/if}
      <Button icon="plus" onclick={() => library.addFiles()}>
        {library.canPickFolder ? 'Choose files' : 'Choose your songs'}
      </Button>
    </div>
    <p class="hint">You can also drop audio files anywhere on this page.</p>
  </div>

  <section class="picks" aria-labelledby="picks-title">
    <div class="picks-head">
      <div>
        <h3 id="picks-title">{discover.mood.title}</h3>
        <p class="hint">
          Feels {discover.mood.moods.join(', ').toLowerCase()}. Changes with your sky.
        </p>
      </div>
      <a class="more" href="#discover">See all</a>
    </div>
    {#if picks.length}
      <TrackList tracks={picks} compact />
    {:else if discover.skyStatus === 'error'}
      <p class="hint">Couldn’t reach the free music library. Check your connection.</p>
    {:else}
      <TrackSkeleton rows={PICKS} label="Finding songs for your sky" />
    {/if}
  </section>
</section>

<style>
.home {
  display: grid;
  gap: var(--space-12);
  padding-block: clamp(var(--space-8), 8vh, 6rem) var(--space-8);
}

.intro {
  display: grid;
  align-content: start;
  gap: var(--space-6);
  max-width: 34rem;
}

.headline {
  font-size: var(--text-3xl);
  letter-spacing: -0.03em;
}

.lead {
  max-width: 30rem;
  color: var(--text-muted);
  font-size: var(--text-lg);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.hint {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.picks {
  display: grid;
  align-content: start;
  gap: var(--space-3);
  min-width: 0;
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.picks-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-3) 0;
}

h3 {
  font-size: var(--text-xl);
  letter-spacing: -0.02em;
}

.more {
  flex: none;
  color: var(--text);
  font-weight: 600;
  text-underline-offset: 3px;
}

/* Wide screens: the promise on the left, the songs on the right. */
@media (min-width: 960px) {
  .home {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
    align-items: center;
    min-height: min(78vh, 720px);
  }
}
</style>
