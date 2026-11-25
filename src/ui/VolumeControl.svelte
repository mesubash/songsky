<script lang="ts">
import { player } from '$lib/player/player.svelte';
import Button from './Button.svelte';

const level = $derived(player.muted ? 0 : player.volume);
</script>

<div class="volume">
  <Button
    variant="icon"
    icon={level === 0 ? 'mute' : 'volume'}
    iconSize={18}
    aria-label={player.muted ? 'Unmute' : 'Mute'}
    onclick={() => player.toggleMute()}
  />
  <input
    class="range"
    type="range"
    min="0"
    max="1"
    step="0.01"
    value={level}
    style:--fill="{level * 100}%"
    aria-label="Volume"
    aria-valuetext="{Math.round(level * 100)}%"
    oninput={(e) => player.setVolume(e.currentTarget.valueAsNumber)}
  >
</div>

<style>
.volume {
  display: flex;
  align-items: center;
  width: 160px;
}
</style>
