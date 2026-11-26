<script lang="ts">
import type { Track } from '$lib/library/types';
import { currentLine, type Lyrics, lyricsFor } from '$lib/lyrics/lyrics';
import { player } from '$lib/player/player.svelte';

/** Lyrics for the playing song: synced lines follow the music; tap a line to jump to it. */
let { track }: { track: Track } = $props();

let lyrics = $state<Lyrics | null>(null);

$effect(() => {
  const t = track;
  let alive = true;
  lyrics = null;
  void lyricsFor(t).then((found) => {
    if (alive) lyrics = found;
  });
  return () => {
    alive = false;
  };
});

const active = $derived(
  lyrics?.kind === 'synced' ? currentLine(lyrics.lines, player.position + 0.3) : -1,
);

let list = $state<HTMLOListElement>();
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Keep the line being sung in the middle of the box.
$effect(() => {
  const line = list?.children[active] as HTMLElement | undefined;
  if (!line || !list) return;
  list.scrollTo({
    top: line.offsetTop - list.clientHeight / 2 + line.clientHeight / 2,
    behavior: reduceMotion ? 'auto' : 'smooth',
  });
});
</script>

<section class="lyrics" aria-label="Lyrics">
  {#if !lyrics}
    <p class="state">Finding lyrics…</p>
  {:else if lyrics.kind === 'synced'}
    <ol bind:this={list}>
      {#each lyrics.lines as line, i (i)}
        <li class:active={i === active} class:past={i < active}>
          <button type="button" onclick={() => player.seek(line.time)}>{line.text || '♪'}</button>
        </li>
      {/each}
    </ol>
  {:else if lyrics.kind === 'plain'}
    <p class="plain">{lyrics.text}</p>
  {:else if lyrics.kind === 'instrumental'}
    <p class="state">This song is instrumental.</p>
  {:else}
    <p class="state">No lyrics found for this song.</p>
  {/if}
  <p class="credit">
    Lyrics from <a href="https://lrclib.net" target="_blank" rel="noopener noreferrer">LRCLIB</a>
  </p>
</section>

<style>
.lyrics {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: var(--space-2);
  height: 100%;
  min-height: 0;
}

ol,
.plain {
  /* So each line's offsetTop is measured from the list, for keeping it centred. */
  position: relative;
  min-height: 0;
  margin: 0;
  padding: var(--space-8) 0;
  overflow-y: auto;
  scrollbar-width: none;
  list-style: none;
  /* Lines fade out towards the top and bottom edges. */
  mask-image: linear-gradient(transparent, #000 15%, #000 80%, transparent);
}

li button {
  display: block;
  width: 100%;
  padding: var(--space-2) 0;
  border: 0;
  background: none;
  color: color-mix(in srgb, var(--text) 45%, transparent);
  font-family: var(--font-display);
  font-size: clamp(1.15rem, 2vw, 1.6rem);
  font-weight: var(--display-weight);
  letter-spacing: -0.01em;
  line-height: 1.25;
  text-align: start;
  transition:
    color 300ms var(--ease-out),
    transform 300ms var(--ease-out);
}

li.past button {
  color: color-mix(in srgb, var(--text) 60%, transparent);
}

li.active button {
  color: var(--text);
  transform: scale(1.02);
  transform-origin: left center;
}

li button:hover {
  color: var(--text);
}

.plain {
  padding-top: var(--space-2);
  color: var(--text);
  font-size: var(--text-lg);
  line-height: 1.6;
  white-space: pre-line;
}

.state {
  align-self: center;
  color: var(--text-muted);
  text-align: center;
}

.credit {
  color: var(--text-muted);
  font-size: var(--text-xs);
}

.credit a {
  color: inherit;
}

@media (prefers-reduced-motion: reduce) {
  li button {
    transition: none;
  }

  li.active button {
    transform: none;
  }
}
</style>
