<script lang="ts">
import { library } from '$lib/library/library.svelte';
import { player } from '$lib/player/player.svelte';
import { toast } from '$lib/toast.svelte';

const NOTICE_MS = 4000;

const message = $derived(
  library.progress
    ? library.progress.total === 0
      ? 'Looking for songs…'
      : `Reading ${library.progress.done} of ${library.progress.total} songs…`
    : (player.error ?? toast.message),
);

// Success notices fade on their own; errors stay until the next action.
$effect(() => {
  if (!toast.message) return;
  const timer = setTimeout(() => toast.clear(), NOTICE_MS);
  return () => clearTimeout(timer);
});
</script>

<div class="status" role="status" aria-live="polite">
  {#if message}
    <p class="message" class:error={!!player.error && !library.progress}>{message}</p>
  {/if}
</div>

<style>
.status {
  position: fixed;
  inset: auto 0 calc(96px + env(safe-area-inset-bottom));
  z-index: 20;
  display: flex;
  justify-content: center;
  padding-inline: var(--space-4);
  pointer-events: none;
}

.message {
  max-width: 32rem;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  background: var(--text);
  color: var(--sky-mid);
  font-size: var(--text-sm);
  font-weight: 550;
  text-align: center;
}

.error {
  background: #ffd9d0;
  color: #5a1408;
}

@media (max-width: 720px) {
  .status {
    bottom: calc(76px + env(safe-area-inset-bottom));
  }
}
</style>
