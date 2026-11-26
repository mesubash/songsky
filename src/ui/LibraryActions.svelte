<script lang="ts">
import { mixOrder } from '$lib/analysis/mix';
import { library } from '$lib/library/library.svelte';
import type { Track } from '$lib/library/types';
import { player } from '$lib/player/player.svelte';
import Button from './Button.svelte';
import PaceButton from './PaceButton.svelte';

/** Play, Shuffle, Mix and Pace for the songs shown (the whole library, or one group). */
let { tracks = library.visibleTracks }: { tracks?: Track[] } = $props();
const ids = $derived(tracks.map((t) => t.id));

/** A mix starting from the playing song if it's among them, or a random one. */
function playMix() {
  const current = player.current?.id;
  const start =
    current && ids.includes(current)
      ? current
      : (tracks[Math.floor(Math.random() * tracks.length)]?.id ?? '');
  void player.playInOrder(mixOrder(tracks, start));
}
</script>

<div class="library-actions">
  <Button
    variant="primary"
    icon="play"
    title="Play your library from the first song"
    onclick={() => player.playList(ids)}
    >Play all</Button
  >
  {#if ids.length > 1}
    <Button
      icon="shuffle"
      title="Play your library in a random order"
      onclick={() => player.shuffleAll(ids)}
      >Shuffle</Button
    >
  {/if}
  {#if ids.length > 2}
    <Button
      icon="disc"
      title="Play songs in an order that flows: close tempo and matching keys"
      onclick={playMix}
      >Mix</Button
    >
  {/if}
  <PaceButton />
</div>

<style>
.library-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}
</style>
