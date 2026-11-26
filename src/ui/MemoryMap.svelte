<script lang="ts">
import { onMount } from 'svelte';
import { library } from '$lib/library/library.svelte';
import type { MemoryMap } from '$lib/memory/map';
import { type PlacePlays, timeAgo } from '$lib/memory/places';
import { sky } from '$lib/sky/sky.svelte';

let { places }: { places: PlacePlays[] } = $props();

let container: HTMLDivElement;
let map = $state<MemoryMap | null>(null);
let failed = $state(false);

/** Popup contents, built from text nodes so song titles can never inject markup. */
function describe(place: PlacePlays): HTMLElement {
  const root = document.createElement('div');
  const name = root.appendChild(document.createElement('strong'));
  name.textContent = place.name;
  const meta = root.appendChild(document.createElement('p'));
  meta.textContent = `${place.count} ${place.count === 1 ? 'play' : 'plays'}, last ${timeAgo(place.lastPlayed)}`;
  const list = root.appendChild(document.createElement('ol'));
  for (const { trackId, count } of place.top) {
    const item = list.appendChild(document.createElement('li'));
    item.textContent = `${library.byId.get(trackId)?.title ?? 'Removed song'} (${count})`;
  }
  return root;
}

onMount(() => {
  let created: MemoryMap | undefined;
  const accent = getComputedStyle(container).getPropertyValue('--accent').trim();
  import('$lib/memory/map')
    .then(({ createMap }) => {
      created = createMap(container, accent);
      map = created;
    })
    .catch(() => {
      failed = true;
    });
  return () => created?.destroy();
});

$effect(() => {
  map?.show(places, describe);
});
</script>

<div class="map" class:dark={sky.time !== 'day'} bind:this={container}>
  {#if failed}
    <p class="failed">The map couldn’t load. Check your connection and open Memories again.</p>
  {/if}
</div>

<style>
.map {
  position: relative;
  z-index: 0;
  height: min(55vh, 460px);
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

/* Night skies get a darkened map so it doesn't glare. */
.dark :global(.leaflet-tile-pane) {
  filter: invert(1) hue-rotate(180deg) brightness(0.85) contrast(0.9) saturate(0.6);
}

.map :global(.leaflet-popup-content-wrapper),
.map :global(.leaflet-popup-tip) {
  background: var(--sky-top);
  color: var(--text);
  font-family: var(--font-sans);
}

.map :global(.leaflet-popup-content p) {
  margin: var(--space-1) 0;
  color: var(--text-muted);
}

.map :global(.leaflet-popup-content ol) {
  margin: 0;
  padding-left: 1.2em;
}

.failed {
  display: grid;
  place-items: center;
  height: 100%;
  padding: var(--space-6);
  color: var(--text-muted);
  text-align: center;
}
</style>
