<script lang="ts">
import { library } from '$lib/library/library.svelte';
import Icon from './Icon.svelte';

let {
  coverId,
  artworkUrl,
  size = 48,
  fluid = false,
}: {
  coverId: string | null;
  /** Streamed songs: cover art from the music service. */
  artworkUrl?: string;
  size?: number;
  /** Fill the parent's width instead of a fixed size. */
  fluid?: boolean;
} = $props();

let url = $state<string | null>(null);

$effect(() => {
  let alive = true;
  url = artworkUrl ?? null;
  if (!artworkUrl && coverId) {
    void library.coverUrl(coverId).then((u) => {
      if (alive) url = u;
    });
  }
  return () => {
    alive = false;
  };
});
</script>

<!-- Decorative: the title is always shown next to it. A cover that fails to load falls
     back to the music note instead of a broken image. -->
<div class="cover" class:fluid style:--size="{size}px">
  {#if url}
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      decoding="async"
      loading="lazy"
      referrerpolicy="no-referrer"
      onerror={() => (url = null)}
    >
  {:else}
    <Icon name="music" size={Math.round(size * 0.4)} />
  {/if}
</div>

<style>
.cover {
  flex: none;
  display: grid;
  place-items: center;
  width: var(--size);
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: clamp(var(--radius-sm), calc(var(--size) * 0.08), var(--radius-lg));
  background: linear-gradient(160deg, var(--sky-horizon), var(--sky-mid));
  color: var(--text-muted);
}

.fluid {
  width: 100%;
}

img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
