<script lang="ts">
import { library } from '$lib/library/library.svelte';
import Button from './Button.svelte';
</script>

<header class="header">
  <h1 class="wordmark">attune<span class="visually-hidden"> music player</span></h1>

  {#if library.tracks.length > 0}
    <div class="actions">
      {#if library.canPickFolder}
        <Button icon="folder" aria-label="Add folder" onclick={() => library.addFolder()}>
          <span class="wide-only">Add folder</span>
        </Button>
      {/if}
      <Button icon="plus" aria-label="Add songs" onclick={() => library.addFiles()}>
        <span class="wide-only">Add songs</span>
      </Button>
    </div>
  {/if}
</header>

<style>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding-block: var(--space-6) var(--space-4);
  padding-top: max(var(--space-6), env(safe-area-inset-top));
}

.wordmark {
  font-size: var(--text-xl);
  font-weight: 750;
  font-variation-settings: "opsz" 48;
  letter-spacing: -0.04em;
}

.actions {
  display: flex;
  gap: var(--space-2);
}

@media (max-width: 720px) {
  .wide-only {
    display: none;
  }

  .actions :global(.button) {
    width: 44px;
    padding: 0;
  }
}
</style>
