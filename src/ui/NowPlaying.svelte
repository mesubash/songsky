<script lang="ts">
import { cubicOut } from 'svelte/easing';
import { fly } from 'svelte/transition';
import { formatTime } from '$lib/format';
import { library } from '$lib/library/library.svelte';
import { player } from '$lib/player/player.svelte';
import Button from './Button.svelte';
import Controls from './Controls.svelte';
import Cover from './Cover.svelte';
import HeartButton from './HeartButton.svelte';
import { modal } from './modal';
import SeekBar from './SeekBar.svelte';
import SongArtSheet from './SongArtSheet.svelte';
import Visualizer from './Visualizer.svelte';

let { open = $bindable(false), onsound }: { open?: boolean; onsound: () => void } = $props();

const UP_NEXT = 5;

let artOpen = $state(false);

// Full screen: the whole page goes full screen, and this player stays on top of it.
const canFullscreen = document.fullscreenEnabled;
let fullscreen = $state(!!document.fullscreenElement);
$effect(() => {
  const update = () => {
    fullscreen = !!document.fullscreenElement;
  };
  document.addEventListener('fullscreenchange', update);
  return () => document.removeEventListener('fullscreenchange', update);
});
// Closing the player also leaves full screen.
$effect(() => {
  if (!open && document.fullscreenElement) void document.exitFullscreen();
});
function toggleFullscreen() {
  void (
    document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen()
  ).catch(() => {});
}

// Song changes slide in from the side they came from: Next from the right,
// Previous from the left. No motion when the person asked for less.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let direction = $state(1);
let lastIndex = player.index;
$effect.pre(() => {
  const index = player.index;
  if (index !== lastIndex) direction = index < lastIndex ? -1 : 1;
  lastIndex = index;
});
const slide = (node: Element, { delay = 0, distance = 80 } = {}) =>
  fly(node, {
    x: direction * distance,
    delay,
    duration: reduceMotion.matches ? 0 : 420,
    easing: cubicOut,
  });

/** The next few songs in the queue, with their queue positions so they can be jumped to. */
const upNext = $derived(
  player.queue
    .slice(player.index + 1, player.index + 1 + UP_NEXT)
    .map((id, i) => ({ index: player.index + 1 + i, track: library.byId.get(id) }))
    .filter((entry) => entry.track !== undefined),
);
</script>

<!-- Native dialog: focus is trapped and Escape closes it. -->
<dialog
  use:modal={open}
  class="now-playing"
  aria-label="Now playing"
  tabindex="-1"
  data-focus-self
  onclose={() => (open = false)}
>
  {#if player.current}
    {@const track = player.current}
    <div class="sheet">
      <header>
        <Button
          variant="icon"
          icon="chevron-down"
          iconSize={26}
          aria-label="Close player"
          onclick={() => (open = false)}
        />
        <span class="spacer"></span>
        <Button
          variant="icon"
          icon="share"
          iconSize={22}
          aria-label="Song art: share or save a picture of this song"
          title="Song art"
          onclick={() => (artOpen = true)}
        />
        {#if canFullscreen}
          <Button
            variant="icon"
            icon={fullscreen ? 'shrink' : 'expand'}
            iconSize={22}
            aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
            title={fullscreen ? 'Exit full screen' : 'Full screen'}
            onclick={toggleFullscreen}
          />
        {/if}
        <Button
          variant="icon"
          icon="sliders"
          iconSize={22}
          aria-label="Sound settings"
          onclick={onsound}
        />
      </header>

      <div class="stage">
        <div class="art">
          {#key track.id}
            <div class="art-slide" in:slide>
              <Cover coverId={track.coverId} artworkUrl={track.artworkUrl} size={560} fluid />
            </div>
          {/key}
        </div>

        <div class="panel">
          {#key track.id}
            <div class="info" in:slide={{ delay: 60, distance: 40 }}>
              <div class="title-row">
                <h2 class="title">{track.title}</h2>
                {#if track.source === 'stream'}
                  <HeartButton {track} size={26} />
                {/if}
              </div>
              <p class="artist">
                {#if track.artistLink}
                  <a href={track.artistLink} target="_blank" rel="noopener noreferrer"
                    >{track.artist}</a
                  >
                  <span class="source">on Audius</span>
                {:else}
                  {track.artist}{track.album ? `, ${track.album}` : ''}
                {/if}
              </p>
              {#if track.bpm || track.key}
                <p class="facts">
                  {#if track.bpm}
                    <span class="fact">{track.bpm} BPM</span>
                  {/if}
                  {#if track.key}
                    <span class="fact" title="Camelot {track.camelot}">{track.key}</span>
                  {/if}
                </p>
              {/if}
            </div>
          {/key}

          <div class="playback">
            <SeekBar />
            <Controls large />
          </div>

          {#if upNext.length}
            <section class="up-next" aria-labelledby="up-next-title">
              <h3 id="up-next-title">Up next</h3>
              <ol>
                {#each upNext as { index, track: next } (next?.id)}
                  {#if next}
                    <li>
                      <button type="button" onclick={() => player.jumpTo(index)}>
                        <Cover coverId={next.coverId} artworkUrl={next.artworkUrl} size={40} />
                        <span class="next-text">
                          <span class="next-title">{next.title}</span>
                          <span class="next-artist">{next.artist}</span>
                        </span>
                        <span class="next-time"
                          >{next.duration ? formatTime(next.duration) : ''}</span
                        >
                      </button>
                    </li>
                  {/if}
                {/each}
              </ol>
            </section>
          {/if}
        </div>
      </div>

      <div class="horizon" aria-hidden="true">
        {#if open && player.effectsAvailable}
          <Visualizer />
        {/if}
      </div>
    </div>
  {/if}
  <SongArtSheet bind:open={artOpen} track={player.current} />
</dialog>

<style>
.now-playing {
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: linear-gradient(180deg, var(--sky-top), var(--sky-mid) 60%, var(--sky-horizon));
  color: var(--text);
}

.now-playing:focus {
  outline: none;
}

.now-playing[open] {
  animation: rise 360ms var(--ease-out);
}

.now-playing::backdrop {
  background: transparent;
}

/* Phone: one column. The stage and panel step aside so their parts stack in order. */
.sheet {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 460px;
  min-height: 100%;
  margin: 0 auto;
  padding: var(--space-4) var(--space-6);
  padding-top: max(var(--space-4), env(safe-area-inset-top));
  padding-bottom: max(var(--space-8), env(safe-area-inset-bottom));
}

.stage,
.panel {
  display: contents;
}

header {
  display: flex;
  gap: var(--space-1);
  margin-inline: calc(var(--space-3) * -1);
}

.spacer {
  flex: 1;
}

.art {
  order: 1;
  flex: 1;
  display: grid;
  align-items: center;
  width: min(100%, 52vh);
  margin: 0 auto;
}

.art :global(.cover) {
  box-shadow: 0 24px 60px -20px rgb(0 0 0 / 0.55);
}

.horizon {
  order: 2;
  height: 64px;
  margin-block: calc(var(--space-4) * -1);
}

.info {
  order: 3;
  display: grid;
  gap: var(--space-1);
}

.playback {
  order: 4;
  display: grid;
  gap: var(--space-6);
}

.up-next {
  display: none;
}

.title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

/* Line the heart up with the first line of the title. */
.title-row :global(.heart) {
  margin-top: -6px;
  margin-inline-end: calc(var(--space-3) * -1);
}

.title {
  font-size: var(--text-xl);
  letter-spacing: -0.02em;
}

.artist {
  color: var(--text-muted);
}

.artist a {
  color: var(--text);
  text-underline-offset: 3px;
}

.source {
  color: var(--text-muted);
}

.facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding-top: var(--space-2);
}

.fact {
  padding: 2px var(--space-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
}

/* Wide screens: cover on the left, everything about the song on the right, and the
   visualizer laid along the bottom of the screen as the horizon. */
@media (min-width: 960px) {
  .sheet {
    position: relative;
    display: grid;
    grid-template-rows: auto 1fr;
    max-width: none;
    height: 100%;
    padding: var(--space-6) clamp(var(--space-8), 5vw, var(--space-16));
    overflow: hidden;
  }

  header {
    position: relative;
    z-index: 1;
  }

  .stage {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, min(42vw, 62vh)) minmax(0, 1fr);
    align-items: center;
    gap: clamp(var(--space-8), 5vw, 5rem);
    width: 100%;
    max-width: 1240px;
    margin: 0 auto;
    padding-bottom: 14vh;
  }

  /* Undo the phone ordering: cover first, then title, playback and Up next. */
  .art,
  .info,
  .playback,
  .up-next {
    order: 0;
  }

  .art {
    width: 100%;
  }

  .panel {
    display: grid;
    gap: var(--space-8);
    max-width: 34rem;
  }

  .title {
    font-size: clamp(2rem, 3.2vw, 3.25rem);
    line-height: 1.05;
    letter-spacing: -0.03em;
  }

  .artist {
    font-size: var(--text-lg);
  }

  .playback {
    gap: var(--space-4);
  }

  .playback :global(.controls.large) {
    justify-content: flex-start;
    gap: var(--space-4);
    width: auto;
  }

  .up-next {
    display: grid;
    gap: var(--space-2);
  }

  .up-next h3 {
    color: var(--text-muted);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .up-next ol {
    display: grid;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .up-next button {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-2);
    border: 0;
    border-radius: var(--radius-md);
    background: none;
    text-align: start;
  }

  .up-next button:hover {
    background: var(--surface);
  }

  .next-text {
    flex: 1;
    display: grid;
    min-width: 0;
  }

  .next-title,
  .next-artist {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .next-title {
    font-weight: 550;
  }

  .next-artist,
  .next-time {
    color: var(--text-muted);
    font-size: var(--text-sm);
    font-variant-numeric: tabular-nums;
  }

  .horizon {
    position: absolute;
    inset: auto 0 0;
    z-index: 0;
    height: 16vh;
    margin: 0;
    opacity: 0.8;
    pointer-events: none;
  }
}

@keyframes rise {
  from {
    transform: translateY(8%);
    opacity: 0;
  }
}
</style>
