<script lang="ts">
import { formatLength } from '$lib/format';
import { library } from '$lib/library/library.svelte';
import { player } from '$lib/player/player.svelte';
import Button from './Button.svelte';
import TrackList from './TrackList.svelte';

const ids = $derived(library.tracks.map((t) => t.id));
const count = $derived(library.tracks.length);

function clearLibrary() {
  if (confirm('Remove all songs from Attune? Your files on this device are not deleted.')) {
    player.pause();
    void library.clear();
  }
}
</script>

<section aria-labelledby="library-title">
  <div class="head">
    <div>
      <h2 id="library-title" class="title">Library</h2>
      <p class="meta">
        {count}
        {count === 1 ? 'song' : 'songs'}{library.totalDuration
          ? `, ${formatLength(library.totalDuration)}`
          : ''}
      </p>
    </div>
    <div class="actions">
      <Button variant="primary" icon="play" onclick={() => player.playList(ids)}>Play</Button>
      <Button icon="shuffle" onclick={() => player.shuffleAll(ids)}>Shuffle</Button>
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
</style>
