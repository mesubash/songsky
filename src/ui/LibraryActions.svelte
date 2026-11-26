<script lang="ts">
import { mixOrder } from '$lib/analysis/mix';
import { library } from '$lib/library/library.svelte';
import { player } from '$lib/player/player.svelte';
import Button from './Button.svelte';
import PaceButton from './PaceButton.svelte';

/** Play, Shuffle, Mix and Pace for the library: in the page on phones, in the top bar on desktop. */
const ids = $derived(library.tracks.map((t) => t.id));
/** A library song is loaded, so the main button pauses or resumes instead of restarting. */
const fromLibrary = $derived(!!player.current && ids.includes(player.current.id));

/** A mix starting from the playing song, or a random one. */
function playMix() {
  const tracks = library.tracks;
  const start = player.current?.id ?? tracks[Math.floor(Math.random() * tracks.length)]?.id ?? '';
  void player.playInOrder(mixOrder(tracks, start));
}
</script>

<div class="library-actions">
  {#if fromLibrary}
    <Button
      variant="primary"
      icon={player.playing ? 'pause' : 'play'}
      onclick={() => player.toggle()}
      >{player.playing ? 'Pause' : 'Resume'}</Button
    >
  {:else}
    <Button
      variant="primary"
      icon="play"
      title="Play your library from the first song"
      onclick={() => player.playList(ids)}
      >Play all</Button
    >
  {/if}
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
