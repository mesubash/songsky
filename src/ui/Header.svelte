<script lang="ts">
import { library } from '$lib/library/library.svelte';
import { player } from '$lib/player/player.svelte';
import { together } from '$lib/together/together.svelte';
import Button from './Button.svelte';
import Logo from './Logo.svelte';
import SkyControl from './SkyControl.svelte';
import TogetherButton from './TogetherButton.svelte';
</script>

<header class="header">
  <h1 class="wordmark">
    <Logo size={34} />songsky<span class="visually-hidden"> music player</span>
  </h1>

  <div class="actions">
    <SkyControl />
    {#if library.tracks.length > 0 || player.current || together.invite}
      <TogetherButton />
    {/if}
    {#if library.tracks.length > 0}
      {#if library.canPickFolder}
        <Button icon="folder" aria-label="Add folder" onclick={() => library.addFolder()}>
          <span class="wide-only">Add folder</span>
        </Button>
      {/if}
      <Button icon="plus" aria-label="Add songs" onclick={() => library.addFiles()}>
        <span class="wide-only">Add songs</span>
      </Button>
    {/if}
  </div>
</header>

<style>
/* Stays at the top while the page scrolls, so the sky and Together buttons are always
   reachable. The band bleeds to the edges; its contents line up with the page. */
.header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-inline: calc(var(--gutter) * -1);
  padding-block: var(--space-3);
  padding-top: max(var(--space-3), env(safe-area-inset-top));
  padding-inline: var(--gutter);
  background: color-mix(in srgb, var(--sky-top) 72%, transparent);
  backdrop-filter: blur(18px) saturate(1.3);
  -webkit-backdrop-filter: blur(18px) saturate(1.3);
}

.wordmark {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-xl);
  letter-spacing: -0.03em;
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

/* Desktop: the sidebar shows the logo, so the header keeps only its actions. */
@media (min-width: 1100px) {
  .header {
    justify-content: flex-end;
    margin-inline: 0;
    padding-inline: max(var(--gutter), calc((100% - var(--content-max)) / 2));
  }

  .wordmark {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}
</style>
