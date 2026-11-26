<script lang="ts">
import { analyzer } from '$lib/analysis/analyzer.svelte';
import { discover } from '$lib/discover/discover.svelte';
import { formatLength } from '$lib/format';
import { library } from '$lib/library/library.svelte';
import { memory } from '$lib/memory/memory.svelte';
import { player } from '$lib/player/player.svelte';
import { prefs } from '$lib/prefs.svelte';
import { sky } from '$lib/sky/sky.svelte';
import { together } from '$lib/together/together.svelte';
import { view } from '$lib/view.svelte';
import Button from './Button.svelte';
import Logo from './Logo.svelte';
import SearchBox from './SearchBox.svelte';
import SkyControl from './SkyControl.svelte';
import TogetherButton from './TogetherButton.svelte';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** The page you are on, shown in the top bar on desktop. Null on the first screen. */
const page = $derived.by((): { title: string; subtitle: string } | null => {
  if (view.current === 'discover') {
    return { title: 'Discover', subtitle: 'Free music from independent artists' };
  }
  if (view.current === 'settings') {
    return { title: 'Settings', subtitle: 'Changes save as you make them' };
  }
  if (view.current === 'memories') {
    const places = memory.places.length;
    return {
      title: 'Memories',
      subtitle: memory.plays.length
        ? `${plural(memory.plays.length, 'play')}${places ? ` in ${plural(places, 'place')}` : ''}`
        : 'Songs you play show up here',
    };
  }
  // A playlist page has its own large heading, so the top bar stays clear.
  if (view.current === 'playlist' || view.current === 'shared' || view.current === 'year') {
    return null;
  }
  const count = library.visibleTracks.length;
  if (!count) return null;
  const length = library.totalDuration ? `, ${formatLength(library.totalDuration)}` : '';
  const reading = analyzer.progress
    ? `. Reading tempo and key: ${analyzer.progress.done} of ${analyzer.progress.total}`
    : '';
  return { title: 'Library', subtitle: `${plural(count, 'song')}${length}${reading}` };
});

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

  {#if page}
    <!-- The page's own heading is in the page for screen readers; this is the visible copy. -->
    <div class="page" aria-hidden="true">
      <span class="page-title">{page.title}</span>
      <span class="page-subtitle">{page.subtitle}</span>
    </div>
  {/if}

  <!-- Each page's own controls (desktop). Phones show them in the page instead. -->
  {#if view.current === 'discover' && discover.hasSongs}
    <div class="header-search"><SearchBox id="header-search" /></div>
  {/if}

  <div class="actions">
    {#if sky.previewing}
      <Button variant="primary" onclick={() => sky.endPreview()}>
        <span class="wide-only">Previewing a sky.</span> Back to my sky
      </Button>
    {/if}
    <SkyControl />
    {#if library.visibleTracks.length > 0 || player.current || together.invite}
      <TogetherButton />
    {/if}
    {#if prefs.localMusic}
      <span class="add-buttons">
        {#if library.canPickFolder}
          <Button icon="folder" aria-label="Add folder" onclick={() => library.addFolder()}>
            <span class="wide-only">Add folder</span>
          </Button>
        {/if}
        <Button icon="plus" aria-label="Add songs" onclick={() => library.addFiles()}>
          <span class="wide-only">Add songs</span>
        </Button>
      </span>
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
  /* Nearly solid, so text scrolling underneath doesn't show through the title. */
  background: color-mix(in srgb, var(--sky-top) 94%, transparent);
  box-shadow:
    0 1px 0 var(--line),
    0 8px 24px -16px rgb(0 0 0 / 0.35);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
}

.page,
.header-search {
  display: none;
}

.page {
  flex-direction: column;
  min-width: 0;
  margin-right: auto;
}

.page-title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--display-weight);
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.page-subtitle {
  overflow: hidden;
  color: var(--text-muted);
  font-size: var(--text-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-search {
  flex: 0 1 24rem;
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
  margin-left: auto;
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

@media (min-width: 1100px) {
  .page {
    display: flex;
  }

  .header-search {
    display: block;
  }
}
.add-buttons {
  display: contents;
}

/* Phones add songs from the Library page instead, keeping the header calm. */
@media (max-width: 720px) {
  .add-buttons {
    display: none;
  }
}
</style>
