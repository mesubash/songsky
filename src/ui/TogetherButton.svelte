<script lang="ts">
import { together } from '$lib/together/together.svelte';
import Button from './Button.svelte';
import TogetherPanel from './TogetherPanel.svelte';

// Opening an invite link shows the Join screen straight away.
let open = $state(together.invite !== null);

const label = $derived(
  together.role === 'host'
    ? `Live, ${together.listeners} listening`
    : together.role === 'guest'
      ? 'Listening along'
      : 'Listen together',
);
</script>

<Button
  icon="users"
  active={together.role !== null}
  aria-label={label}
  title={label}
  onclick={() => (open = true)}
>
  <span class="wide-only">{together.role ? label : 'Together'}</span>
</Button>
<TogetherPanel bind:open />

<style>
@media (max-width: 720px) {
  .wide-only {
    display: none;
  }
}
</style>
