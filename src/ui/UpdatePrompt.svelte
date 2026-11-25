<script lang="ts">
import { pwa } from '$lib/pwa.svelte';
import Button from './Button.svelte';
</script>

{#if pwa.updateReady}
  <div class="update" role="alert">
    <p>A new version of Attune is ready.</p>
    <div class="actions">
      <Button onclick={() => pwa.dismiss()}>Later</Button>
      <Button variant="primary" onclick={() => pwa.update()}>Update</Button>
    </div>
  </div>
{/if}

<style>
.update {
  position: fixed;
  inset: var(--space-4) var(--space-4) auto auto;
  z-index: 40;
  display: grid;
  gap: var(--space-3);
  max-width: 22rem;
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--sky-top) 92%, var(--text));
  animation: appear 220ms var(--ease-out);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

@media (max-width: 720px) {
  .update {
    inset-inline: var(--space-3);
    max-width: none;
  }
}

@keyframes appear {
  from {
    transform: translateY(-8px);
    opacity: 0;
  }
}
</style>
