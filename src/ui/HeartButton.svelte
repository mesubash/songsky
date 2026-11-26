<script lang="ts">
import { library } from '$lib/library/library.svelte';
import type { Track } from '$lib/library/types';
import Icon from './Icon.svelte';

/** Save a streamed song to the library (or remove it), with a small pop so it feels done. */
let { track, size = 18 }: { track: Track; size?: number } = $props();

const saved = $derived(library.isSaved(track.id));
/** Only animate changes the person made, not hearts that were already filled. */
let changed = $state(false);

function toggle() {
  changed = true;
  void (saved ? library.remove(track.id) : library.save(track));
}
</script>

<button
  class="heart"
  class:on={saved}
  class:pop={changed && saved}
  class:drop={changed && !saved}
  type="button"
  aria-pressed={saved}
  aria-label={saved
    ? `Remove ${track.title} from your library`
    : `Save ${track.title} to your library`}
  title={saved ? 'Saved to your library' : 'Save to your library'}
  onclick={toggle}
  onanimationend={() => (changed = false)}
>
  <Icon name="heart" {size} />
</button>

<style>
.heart {
  position: relative;
  display: grid;
  flex: none;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--text-muted);
}

.heart:hover {
  background: var(--surface);
  color: var(--text);
}

.heart.on {
  color: var(--accent);
}

.heart.on :global(path) {
  fill: currentColor;
}

.heart :global(svg) {
  transition: transform var(--duration-fast) var(--ease-out);
}

.heart:active :global(svg) {
  transform: scale(0.85);
}

/* Saved: the heart pops and a ring pulses out from it. */
.pop :global(svg) {
  animation: pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pop::after {
  content: "";
  position: absolute;
  inset: 8px;
  border: 2px solid var(--accent);
  border-radius: 50%;
  animation: ring 520ms var(--ease-out) forwards;
  pointer-events: none;
}

/* Removed: a quick shrink back to the outline. */
.drop :global(svg) {
  animation: drop 260ms var(--ease-out);
}

@keyframes pop {
  0% {
    transform: scale(0.6);
  }
  60% {
    transform: scale(1.25);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes ring {
  from {
    opacity: 0.8;
    transform: scale(0.6);
  }
  to {
    opacity: 0;
    transform: scale(1.5);
  }
}

@keyframes drop {
  50% {
    transform: scale(0.75);
  }
}
</style>
