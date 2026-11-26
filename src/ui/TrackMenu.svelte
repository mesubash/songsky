<script lang="ts">
import type { Track } from '$lib/library/types';
import { player } from '$lib/player/player.svelte';
import { toast } from '$lib/toast.svelte';
import Icon from './Icon.svelte';

/** The ⋯ menu on a song: Play next and Add to queue. Uses the browser's popover, so
    clicking outside or pressing Escape closes it. */
let { track }: { track: Track } = $props();

let button = $state<HTMLButtonElement>();
let menu = $state<HTMLDivElement>();
const menuId = $props.id();

/** Opens below the button, or above it when there's no room below. */
function place(event: ToggleEvent) {
  if (event.newState !== 'open' || !button || !menu) return;
  const at = button.getBoundingClientRect();
  const height = menu.offsetHeight;
  const below = at.bottom + 4 + height < innerHeight;
  menu.style.top = `${below ? at.bottom + 4 : at.top - height - 4}px`;
  menu.style.left = `${Math.max(8, at.right - menu.offsetWidth)}px`;
  menu.querySelector('button')?.focus();
}

function run(action: () => void, message: string) {
  action();
  menu?.hidePopover();
  toast.show(message);
}
</script>

<button
  bind:this={button}
  class="more"
  type="button"
  popovertarget={menuId}
  aria-label="More for {track.title}"
  title="More"
>
  <Icon name="more" size={18} />
</button>
<div bind:this={menu} id={menuId} class="menu" popover="auto" role="menu" ontoggle={place}>
  <button
    type="button"
    role="menuitem"
    onclick={() => run(() => player.playNextUp(track.id), `${track.title} plays next.`)}
  >
    <Icon name="play-next" size={18} />Play next
  </button>
  <button
    type="button"
    role="menuitem"
    onclick={() => run(() => player.addToQueue(track.id), `Added ${track.title} to the queue.`)}
  >
    <Icon name="queue" size={18} />Add to queue
  </button>
</div>

<style>
.more {
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

.more:hover {
  background: var(--surface-strong);
  color: var(--text);
}

.menu {
  position: fixed;
  inset: auto;
  min-width: 12rem;
  margin: 0;
  padding: var(--space-1);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--sky-top) 94%, var(--text));
  box-shadow: 0 16px 40px -16px rgb(0 0 0 / 0.45);
  color: var(--text);
}

.menu button {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: 40px;
  padding: 0 var(--space-3);
  border: 0;
  border-radius: var(--radius-sm, 8px);
  background: none;
  font-weight: 550;
  text-align: start;
}

.menu button:hover,
.menu button:focus-visible {
  background: var(--surface-strong);
}
</style>
