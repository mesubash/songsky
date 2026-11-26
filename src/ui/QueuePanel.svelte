<script lang="ts">
import { formatTime } from '$lib/format';
import { library } from '$lib/library/library.svelte';
import { player } from '$lib/player/player.svelte';
import Button from './Button.svelte';
import Cover from './Cover.svelte';
import { modal } from './modal';

/** The whole queue: what's playing, then everything coming up. Reorder, remove, clear. */
let { open = $bindable(false) }: { open?: boolean } = $props();

const upcoming = $derived(
  player.queue
    .map((id, index) => ({ index, track: library.byId.get(id) }))
    .slice(player.index + 1)
    .filter((entry) => entry.track !== undefined),
);

/** Drag and drop to reorder (mouse). The arrow buttons do the same for keyboard and touch. */
let dragFrom = $state<number | null>(null);
let dragOver = $state<number | null>(null);

function drop(to: number) {
  if (dragFrom !== null && dragFrom !== to) player.moveInQueue(dragFrom, to);
  dragFrom = dragOver = null;
}

function closeOnBackdrop(event: MouseEvent) {
  if (event.target === event.currentTarget) open = false;
}
</script>

<!-- biome-ignore lint/a11y/useKeyWithClickEvents: Escape already closes the native dialog; this only handles backdrop clicks. -->
<dialog
  class="queue"
  use:modal={open}
  aria-labelledby="queue-title"
  onclose={() => (open = false)}
  onclick={closeOnBackdrop}
>
  <div class="content">
    <header>
      <h2 id="queue-title">Queue</h2>
      <Button variant="icon" icon="close" aria-label="Close queue" onclick={() => (open = false)} />
    </header>

    {#if player.current}
      {@const track = player.current}
      <section aria-labelledby="queue-now">
        <h3 id="queue-now">Now playing</h3>
        <div class="item now">
          <Cover coverId={track.coverId} artworkUrl={track.artworkUrl} size={44} />
          <span class="text">
            <span class="title">{track.title}</span>
            <span class="artist">{track.artist}</span>
          </span>
          <span class="time">{track.duration ? formatTime(track.duration) : ''}</span>
        </div>
      </section>
    {/if}

    <section aria-labelledby="queue-next">
      <div class="next-head">
        <h3 id="queue-next">Up next</h3>
        {#if upcoming.length}
          <button class="clear" type="button" onclick={() => player.clearUpcoming()}>Clear</button>
        {/if}
      </div>
      {#if upcoming.length}
        <ol>
          {#each upcoming as { index, track }, i (track?.id)}
            {#if track}
              <li
                class="item"
                class:dragging={dragFrom === index}
                class:over={dragOver === index && dragFrom !== index}
                draggable="true"
                ondragstart={(e) => {
                  dragFrom = index;
                  e.dataTransfer?.setData('text/plain', track.id);
                }}
                ondragover={(e) => {
                  e.preventDefault();
                  dragOver = index;
                }}
                ondrop={(e) => {
                  e.preventDefault();
                  drop(index);
                }}
                ondragend={() => (dragFrom = dragOver = null)}
              >
                <button
                  class="play"
                  type="button"
                  aria-label="Play {track.title} now"
                  onclick={() => player.jumpTo(index)}
                >
                  <Cover coverId={track.coverId} artworkUrl={track.artworkUrl} size={44} />
                  <span class="text">
                    <span class="title">{track.title}</span>
                    <span class="artist">{track.artist}</span>
                  </span>
                </button>
                <span class="tools">
                  <Button
                    variant="icon"
                    icon="arrow-up"
                    iconSize={16}
                    aria-label="Move {track.title} up"
                    disabled={i === 0}
                    onclick={() => player.moveInQueue(index, index - 1)}
                  />
                  <Button
                    variant="icon"
                    icon="arrow-down"
                    iconSize={16}
                    aria-label="Move {track.title} down"
                    disabled={i === upcoming.length - 1}
                    onclick={() => player.moveInQueue(index, index + 1)}
                  />
                  <Button
                    variant="icon"
                    icon="close"
                    iconSize={16}
                    aria-label="Remove {track.title} from the queue"
                    onclick={() => player.removeFromQueue(index)}
                  />
                </span>
              </li>
            {/if}
          {/each}
        </ol>
      {:else}
        <p class="empty">
          Nothing coming up. Use “Play next” or “Add to queue” from any song’s ⋯ menu.
        </p>
      {/if}
    </section>
  </div>
</dialog>

<style>
/* A sheet on the right on wide screens, full width at the bottom on phones. */
.queue {
  width: min(100%, 28rem);
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0 0 0 auto;
  padding: 0;
  border: 0;
  border-left: 1px solid var(--line);
  background: color-mix(in srgb, var(--sky-top) 94%, var(--text));
  color: var(--text);
}

.queue::backdrop {
  background: rgb(0 0 0 / 0.35);
}

.queue[open] {
  animation: slide-in 260ms var(--ease-out);
}

.content {
  display: grid;
  align-content: start;
  gap: var(--space-6);
  padding: var(--space-4) var(--space-4) var(--space-8) var(--space-6);
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

h2 {
  font-size: var(--text-xl);
  letter-spacing: -0.02em;
}

h3 {
  padding-bottom: var(--space-2);
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
}

.next-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.clear {
  min-height: 36px;
  padding: 0 var(--space-2);
  border: 0;
  background: none;
  color: var(--text-muted);
  font-size: var(--text-sm);
  text-decoration: underline;
  text-underline-offset: 3px;
}

ol {
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  border-radius: var(--radius-md);
}

.item.now {
  padding: var(--space-2);
  background: var(--surface-strong);
}

li.item:hover {
  background: var(--surface);
}

li.item.dragging {
  opacity: 0.4;
}

li.item.over {
  box-shadow: inset 0 2px 0 var(--accent);
}

.play {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  padding: var(--space-2);
  border: 0;
  background: none;
  text-align: start;
  cursor: grab;
}

.text {
  flex: 1;
  display: grid;
  min-width: 0;
}

.title,
.artist {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title {
  font-weight: 550;
}

.artist,
.time,
.empty {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.tools {
  display: flex;
  flex: none;
}

/* Touch screens show the tools all the time; mouse users see them on hover or focus. */
@media (hover: hover) {
  .tools {
    opacity: 0;
  }

  li.item:hover .tools,
  li.item:focus-within .tools {
    opacity: 1;
  }
}

@media (max-width: 720px) {
  .queue {
    width: 100%;
    border-left: 0;
  }
}

@keyframes slide-in {
  from {
    transform: translateX(40px);
    opacity: 0;
  }
}
</style>
