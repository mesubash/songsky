<script lang="ts">
import { formatTime } from '$lib/format';
import { library } from '$lib/library/library.svelte';
import type { Track } from '$lib/library/types';
import { player } from '$lib/player/player.svelte';
import Cover from './Cover.svelte';

let { tracks }: { tracks: Track[] } = $props();

const ids = $derived(tracks.map((t) => t.id));
</script>

<ol class="list">
  {#each tracks as track, i (track.id)}
    {@const isCurrent = player.current?.id === track.id}
    {@const available = library.isAvailable(track)}
    <li class:current={isCurrent} class:unavailable={!available}>
      <button
        class="row"
        type="button"
        aria-current={isCurrent ? 'true' : undefined}
        title={available ? undefined : 'Add this file again to play it'}
        onclick={() => (isCurrent ? player.toggle() : player.playList(ids, i))}
      >
        <span class="index" aria-hidden="true">
          {#if isCurrent}
            <span class="bars" class:paused={!player.playing}><i></i><i></i><i></i></span>
          {:else}
            {i + 1}
          {/if}
        </span>
        <Cover coverId={track.coverId} size={44} />
        <span class="main">
          <span class="title">{track.title}</span>
          <span class="artist">{track.artist}</span>
        </span>
        <span class="album">{track.album}</span>
        <span class="duration">{track.duration ? formatTime(track.duration) : ''}</span>
      </button>
    </li>
  {/each}
</ol>

<style>
.list {
  padding: 0;
  list-style: none;
}

li {
  /* Off-screen rows skip layout and paint, so long libraries stay smooth. */
  content-visibility: auto;
  contain-intrinsic-size: auto 60px;
}

.row {
  display: grid;
  grid-template-columns: 2.5rem auto minmax(0, 2fr) minmax(0, 1.2fr) 4rem;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
  min-height: 60px;
  padding: var(--space-2) var(--space-3);
  border: 0;
  border-radius: var(--radius-md);
  background: none;
  text-align: start;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.row:hover {
  background: var(--surface);
}

.current .row {
  background: var(--surface-strong);
}

.unavailable .row {
  opacity: 0.45;
}

.index,
.duration,
.album,
.artist {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.index {
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.duration {
  text-align: end;
  font-variant-numeric: tabular-nums;
}

.main {
  display: grid;
  min-width: 0;
}

.title,
.artist,
.album {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title {
  font-weight: 550;
}

.current .title {
  color: var(--accent);
}

/* Playing indicator: three bars that bounce while playing and rest when paused. */
.bars {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 14px;
}

.bars i {
  width: 3px;
  height: 100%;
  border-radius: 1px;
  background: var(--accent);
  transform-origin: bottom;
  animation: bounce 900ms ease-in-out infinite alternate;
}

.bars i:nth-child(2) {
  animation-delay: -300ms;
}

.bars i:nth-child(3) {
  animation-delay: -600ms;
}

.bars.paused i {
  animation-play-state: paused;
}

@keyframes bounce {
  from {
    transform: scaleY(0.25);
  }
}

@media (max-width: 720px) {
  .row {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: var(--space-3);
    padding-inline: var(--space-2);
  }

  .index,
  .album {
    display: none;
  }
}
</style>
