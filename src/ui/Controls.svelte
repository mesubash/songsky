<script lang="ts">
import { player } from '$lib/player/player.svelte';
import Button from './Button.svelte';
import Icon from './Icon.svelte';

let { large = false }: { large?: boolean } = $props();

const repeatLabel = $derived(
  { off: 'Repeat: off', all: 'Repeat: all', one: 'Repeat: this song' }[player.repeat],
);
</script>

<div class="controls" class:large>
  <Button
    variant="icon"
    icon="shuffle"
    iconSize={large ? 22 : 18}
    active={player.shuffle}
    aria-pressed={player.shuffle}
    aria-label="Shuffle"
    onclick={() => player.toggleShuffle()}
  />
  <Button
    variant="icon"
    icon="prev"
    iconSize={large ? 30 : 22}
    aria-label="Previous"
    disabled={!player.current}
    onclick={() => player.prev()}
  />
  <button
    class="play"
    type="button"
    aria-label={player.playing ? 'Pause' : 'Play'}
    onclick={() => player.toggle()}
  >
    <Icon name={player.playing ? 'pause' : 'play'} size={large ? 30 : 20} />
  </button>
  <Button
    variant="icon"
    icon="next"
    iconSize={large ? 30 : 22}
    aria-label="Next"
    disabled={!player.current}
    onclick={() => player.next()}
  />
  <Button
    variant="icon"
    icon={player.repeat === 'one' ? 'repeat-one' : 'repeat'}
    iconSize={large ? 22 : 18}
    active={player.repeat !== 'off'}
    aria-label={repeatLabel}
    title={repeatLabel}
    onclick={() => player.cycleRepeat()}
  />
</div>

<style>
.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.large {
  justify-content: space-between;
  width: 100%;
}

.play {
  --size: 44px;

  display: grid;
  place-items: center;
  width: var(--size);
  height: var(--size);
  border: 0;
  border-radius: 50%;
  background: var(--text);
  color: var(--sky-mid);
  transition: transform var(--duration-fast) var(--ease-out);
}

.play:hover {
  transform: scale(1.06);
}

.play:active {
  transform: scale(0.94);
}

.large .play {
  --size: 72px;
}
</style>
