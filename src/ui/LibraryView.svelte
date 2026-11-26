<script lang="ts">
import { analyzer } from '$lib/analysis/analyzer.svelte';
import { formatLength } from '$lib/format';
import { library } from '$lib/library/library.svelte';
import { memory } from '$lib/memory/memory.svelte';
import { player } from '$lib/player/player.svelte';
import LibraryActions from './LibraryActions.svelte';
import TrackList from './TrackList.svelte';

const count = $derived(library.tracks.length);

function clearLibrary() {
  if (confirm('Remove all songs from Songsky? Your files on this device are not deleted.')) {
    player.pause();
    void library.clear();
    memory.forget();
  }
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
      <div class="page-control"><LibraryActions /></div>
      <button class="clear" type="button" onclick={clearLibrary}>Clear library</button>
    </div>
  </div>

  <TrackList tracks={library.tracks} />
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

/* Desktop shows the title in the top bar, so this row holds only the actions. */
@media (min-width: 1100px) {
  .head {
    justify-content: flex-end;
    padding-block: var(--space-4);
  }
}

@media (min-width: 1100px) {
  .page-control {
    display: none;
  }
}
</style>
