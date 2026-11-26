<script lang="ts">
import { pace, paceSupported } from '$lib/pace/pace.svelte';
import { toast } from '$lib/toast.svelte';
import Button from './Button.svelte';

async function toggle() {
  if (pace.active) {
    pace.stop();
    return;
  }
  await pace.start();
  if (pace.error) toast.show(pace.error);
  else toast.show('Start walking. Songs will follow your pace in a few steps.');
}
</script>

{#if paceSupported}
  <Button icon="walk" active={pace.active} aria-pressed={pace.active} onclick={toggle}>
    {#if pace.active}
      {pace.cadence ? `${pace.cadence} steps/min` : 'Finding your pace…'}
    {:else}
      Match my pace
    {/if}
  </Button>
{/if}
