<script lang="ts">
import { formatTime } from '$lib/format';
import { library } from '$lib/library/library.svelte';
import type { Track } from '$lib/library/types';
import { player } from '$lib/player/player.svelte';
import Cover from './Cover.svelte';
import HeartButton from './HeartButton.svelte';
import Icon from './Icon.svelte';

let {
  tracks,
  compact = false,
}: {
  tracks: Track[];
  /** Narrow places (a card): no album or tempo columns, so titles get the room. */
  compact?: boolean;
} = $props();

const ids = $derived(tracks.map((t) => t.id));
/** Streamed songs get Save and Audius buttons; keep the space so columns line up. */
const hasStreams = $derived(tracks.some((t) => t.source === 'stream'));
</script>

<ol class="list" class:compact>
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
            <span class="number">{i + 1}</span>
            <span class="play-icon"><Icon name="play" size={14} /></span>
          {/if}
        </span>
        <Cover coverId={track.coverId} artworkUrl={track.artworkUrl} size={44} />
        <span class="main">
          <span class="title">{track.title}</span>
          <span class="artist">{track.artist}</span>
        </span>
        <span class="album">{track.album}</span>
        <span class="tempo">
          {#if track.bpm}
            {track.bpm}
          {/if}
          {#if track.camelot}
            <abbr class="key" title={track.key}>{track.camelot}</abbr>
          {/if}
        </span>
        <span class="duration">{track.duration ? formatTime(track.duration) : ''}</span>
      </button>
      {#if hasStreams}
        <span class="actions">
          {#if track.source === 'stream'}
            <HeartButton {track} />
            {#if track.link}
              <a
                class="action link"
                href={track.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open {track.title} by {track.artist} on Audius"
                title="Open on Audius"
              >
                <Icon name="external" size={16} />
              </a>
            {/if}
          {/if}
        </span>
      {/if}
    </li>
  {/each}
</ol>

<style>
.list {
  padding: 0;
  list-style: none;
}

li {
  display: flex;
  align-items: center;
  /* Off-screen rows skip layout and paint, so long libraries stay smooth. */
  content-visibility: auto;
  contain-intrinsic-size: auto 60px;
}

.row {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: 2.5rem auto minmax(0, 2fr) minmax(0, 1.2fr) 6rem 4rem;
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
  display: grid;
  place-items: center;
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

.actions {
  display: flex;
  flex: none;
  width: 88px;
  justify-content: flex-end;
}

.action {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--text-muted);
}

.action:hover {
  background: var(--surface);
  color: var(--text);
}

/* Hovering a row swaps its number for a play icon, so it is clear the row plays. */
.play-icon {
  display: none;
  color: var(--text);
}

.row:hover .number,
.row:focus-visible .number {
  display: none;
}

.row:hover .play-icon,
.row:focus-visible .play-icon {
  display: grid;
}

@keyframes bounce {
  from {
    transform: scaleY(0.25);
  }
}

.tempo {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
}

.key {
  min-width: 2.6em;
  padding: 1px var(--space-2);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  text-align: center;
  text-decoration: none;
}

@media (max-width: 900px) {
  .row {
    grid-template-columns: 2.5rem auto minmax(0, 2fr) minmax(0, 1.2fr) 4rem;
  }

  .tempo {
    display: none;
  }
}

@media (max-width: 720px) {
  .actions {
    width: 44px;
  }

  .action.link {
    display: none;
  }

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

.compact .row {
  grid-template-columns: 2.5rem auto minmax(0, 1fr) 3.5rem;
}

.compact .album,
.compact .tempo {
  display: none;
}
</style>
