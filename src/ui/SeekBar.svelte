<script lang="ts">
import { formatTime } from '$lib/format';
import { player } from '$lib/player/player.svelte';

let { showTimes = true }: { showTimes?: boolean } = $props();

/** While dragging, show the drag position and seek only on release. */
let dragging = $state<number | null>(null);
const value = $derived(dragging ?? player.position);
const max = $derived(player.duration || 0);
const fill = $derived(max > 0 ? (value / max) * 100 : 0);
</script>

<div class="seek">
  {#if showTimes}
    <span class="time">{formatTime(value)}</span>
  {/if}
  <input
    class="range"
    type="range"
    min="0"
    {max}
    step="0.1"
    {value}
    disabled={!player.current}
    style:--fill="{fill}%"
    aria-label="Seek"
    aria-valuetext="{formatTime(value)} of {formatTime(max)}"
    oninput={(e) => (dragging = e.currentTarget.valueAsNumber)}
    onchange={(e) => {
      player.seek(e.currentTarget.valueAsNumber);
      dragging = null;
    }}
  >
  {#if showTimes}
    <span class="time">{formatTime(max)}</span>
  {/if}
</div>

<style>
.seek {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
}

.time {
  min-width: 5ch;
  color: var(--text-muted);
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
}

.time:last-child {
  text-align: end;
}
</style>
