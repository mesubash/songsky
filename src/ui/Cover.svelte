<script lang="ts">
import { library } from '$lib/library/library.svelte';
import Icon from './Icon.svelte';

let {
  coverId,
  size = 48,
  fluid = false,
}: {
  coverId: string | null;
  size?: number;
  /** Fill the parent's width instead of a fixed size. */
  fluid?: boolean;
} = $props();

let url = $state<string | null>(null);

$effect(() => {
  let alive = true;
  url = null;
  if (coverId) {
    void library.coverUrl(coverId).then((u) => {
      if (alive) url = u;
    });
  }
  return () => {
    alive = false;
  };
});
</script>

<!-- Decorative: the title is always shown next to it. -->
<div class="cover" class:fluid style:--size="{size}px">
  {#if url}
    <img src={url} alt="" width={size} height={size} decoding="async">
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
