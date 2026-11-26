<script lang="ts">
import { mixOrder } from '$lib/analysis/mix';
import { library } from '$lib/library/library.svelte';
import { player } from '$lib/player/player.svelte';
import Button from './Button.svelte';
import PaceButton from './PaceButton.svelte';

/** Play, Shuffle, Mix and Pace for the library: in the page on phones, in the top bar on desktop. */
const ids = $derived(library.tracks.map((t) => t.id));

/** A mix starting from the playing song, or a random one. */
function playMix() {
  const tracks = library.tracks;
  const start = player.current?.id ?? tracks[Math.floor(Math.random() * tracks.length)]?.id ?? '';
  void player.playInOrder(mixOrder(tracks, start));
}
</script>

<div class="library-actions">
  <Button variant="primary" icon="play" onclick={() => player.playList(ids)}>Play</Button>
  <Button icon="shuffle" onclick={() => player.shuffleAll(ids)}>Shuffle</Button>
  <Button
    icon="disc"
    title="Play songs in an order that flows: close tempo and matching keys"
    onclick={playMix}
    >Mix</Button
  >
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
