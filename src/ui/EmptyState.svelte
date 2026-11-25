<script lang="ts">
import { library } from '$lib/library/library.svelte';
import Button from './Button.svelte';
</script>

<section class="empty" aria-labelledby="empty-title">
  <h2 id="empty-title" class="headline">Bring your own music.</h2>
  <p class="lead">
    Attune plays songs saved on this device. Nothing is uploaded, and your library is here next time
    you open it.
  </p>
  <div class="actions">
    {#if library.canPickFolder}
      <Button variant="primary" icon="folder" onclick={() => library.addFolder()}
        >Choose a folder</Button
      >
      <Button icon="plus" onclick={() => library.addFiles()}>Choose files</Button>
    {:else}
      <Button variant="primary" icon="plus" onclick={() => library.addFiles()}>Choose songs</Button>
    {/if}
  </div>
  <p class="hint">You can also drop audio files anywhere on this page.</p>
</section>

<style>
.empty {
  display: grid;
  gap: var(--space-6);
  max-width: 34rem;
  padding-block: clamp(var(--space-12), 12vh, 8rem);
}

.headline {
  font-size: var(--text-3xl);
  letter-spacing: -0.03em;
}

.lead {
  max-width: 30rem;
  color: var(--text-muted);
  font-size: var(--text-lg);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.hint {
  color: var(--text-muted);
  font-size: var(--text-sm);
}
</style>
