<script lang="ts">
import { onMount } from 'svelte';
import { isAudioFile } from '$lib/library/files';
import { library } from '$lib/library/library.svelte';
import { memory } from '$lib/memory/memory.svelte';
import { player } from '$lib/player/player.svelte';
import { view } from '$lib/view.svelte';
import DiscoverView from './ui/DiscoverView.svelte';
import EmptyState from './ui/EmptyState.svelte';
import Header from './ui/Header.svelte';
import LibraryView from './ui/LibraryView.svelte';
import MemoriesView from './ui/MemoriesView.svelte';
import NowPlaying from './ui/NowPlaying.svelte';
import PlayerBar from './ui/PlayerBar.svelte';
import Sidebar from './ui/Sidebar.svelte';
import SkyEffects from './ui/SkyEffects.svelte';
import SoundPanel from './ui/SoundPanel.svelte';
import StatusMessage from './ui/StatusMessage.svelte';
import UpdatePrompt from './ui/UpdatePrompt.svelte';
import ViewTabs from './ui/ViewTabs.svelte';

let ready = $state(false);
let nowPlayingOpen = $state(false);
let soundOpen = $state(false);
let dragging = $state(false);

onMount(async () => {
  await Promise.all([library.load(), memory.load()]);
  player.restore();
  ready = true;
});

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName))
  );
}

function onkeydown(event: KeyboardEvent) {
  if (event.code === 'Space' && !isTyping(event.target)) {
    event.preventDefault();
    void player.toggle();
  }
}

const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes('Files') ?? false;

function ondrop(event: DragEvent) {
  if (!hasFiles(event)) return;
  event.preventDefault();
  dragging = false;
  const files = [...(event.dataTransfer?.files ?? [])].filter((f) => isAudioFile(f.name));
  if (files.length) void library.addFiles(files);
}
</script>

<svelte:window
  {onkeydown}
  ondragover={(e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragging = true;
  }}
  ondragleave={(e) => {
    if (!e.relatedTarget) dragging = false;
  }}
  {ondrop}
/>

<SkyEffects />

<div class="app" class:has-player={!!player.current}>
  <Sidebar />
  <div class="content">
    <Header />
    <main>
      {#if ready}
        <ViewTabs />
        {#if view.current === 'discover'}
          <DiscoverView />
        {:else if view.current === 'memories'}
          <MemoriesView />
        {:else if library.tracks.length > 0}
          <LibraryView />
        {:else}
          <EmptyState />
        {/if}
      {/if}
    </main>
  </div>
</div>

<PlayerBar onexpand={() => (nowPlayingOpen = true)} onsound={() => (soundOpen = true)} />
<NowPlaying bind:open={nowPlayingOpen} onsound={() => (soundOpen = true)} />
<SoundPanel bind:open={soundOpen} />
<StatusMessage />
<UpdatePrompt />

{#if dragging}
  <div class="drop" aria-hidden="true"><p>Drop to add songs</p></div>
{/if}

<style>
.app {
  max-width: calc(var(--content-max) + 2 * var(--gutter));
  margin: 0 auto;
  padding-inline: max(var(--gutter), env(safe-area-inset-left, 0px));
  padding-bottom: var(--space-12);
}

.has-player {
  padding-bottom: calc(120px + env(safe-area-inset-bottom));
}

/* Desktop: sidebar on the left, content using the rest of the width. */
@media (min-width: 1100px) {
  .app {
    display: grid;
    grid-template-columns: 17rem minmax(0, 1fr);
    max-width: none;
    padding: 0;
  }

  /* The column is full width so the sticky header can span it; the page itself is
     centered inside at the shared content width. */
  .content {
    min-width: 0;
    padding-bottom: var(--space-12);
  }

  main {
    max-width: calc(var(--content-max) + 2 * var(--gutter));
    margin-inline: auto;
    padding-inline: var(--gutter);
  }

  .has-player .content {
    padding-bottom: calc(120px + env(safe-area-inset-bottom));
  }
}

.drop {
  position: fixed;
  inset: var(--space-4);
  z-index: 30;
  display: grid;
  place-items: center;
  border: 2px dashed var(--text);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--sky-top) 70%, transparent);
  font-size: var(--text-xl);
  font-weight: 650;
  pointer-events: none;
}
</style>
