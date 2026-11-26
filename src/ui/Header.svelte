<script lang="ts">
import { library } from '$lib/library/library.svelte';
import { player } from '$lib/player/player.svelte';
import { together } from '$lib/together/together.svelte';
import Button from './Button.svelte';
import Logo from './Logo.svelte';
import SearchBox from './SearchBox.svelte';
import SkyControl from './SkyControl.svelte';
import TogetherButton from './TogetherButton.svelte';

/** See-through at the top of the page; a soft band appears once content scrolls under it. */
let scrolled = $state(false);

$effect(() => {
  const update = () => {
    scrolled = window.scrollY > 4;
  };
  update();
  addEventListener('scroll', update, { passive: true });
  return () => removeEventListener('scroll', update);
});
</script>

<header class="header" class:scrolled>
  <h1 class="wordmark">
    <Logo size={34} />songsky<span class="visually-hidden"> music player</span>
  </h1>

  <div class="header-search"><SearchBox id="header-search" /></div>

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
  transition:
    background-color 200ms var(--ease-out),
    box-shadow 200ms var(--ease-out);
}

.scrolled {
  background: color-mix(in srgb, var(--sky-top) 55%, transparent);
  box-shadow: 0 8px 24px -16px rgb(0 0 0 / 0.35);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
}

.header-search {
  display: none;
  flex: 1;
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

@media (min-width: 960px) {
  .header-search {
    display: block;
  }
}
</style>
