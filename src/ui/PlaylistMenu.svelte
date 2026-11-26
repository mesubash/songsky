<script lang="ts">
import { ask } from '$lib/confirm.svelte';
import type { Playlist } from '$lib/library/types';
import { playlists } from '$lib/playlists/playlists.svelte';
import { toast } from '$lib/toast.svelte';
import { playlistHref, view } from '$lib/view.svelte';
import Icon from './Icon.svelte';
import { placeMenu } from './menu';

/** ⋯ menu for a playlist (sidebar and playlist page): Rename and Delete. */
let { playlist, small = false }: { playlist: Playlist; small?: boolean } = $props();

let button = $state<HTMLButtonElement>();
let menu = $state<HTMLDivElement>();
const menuId = $props.id();

function rename() {
  menu?.hidePopover();
  playlists.renameRequest = playlist.id;
  location.hash = playlistHref(playlist.id);
}

async function remove() {
  menu?.hidePopover();
  const ok = await ask({
    title: `Delete “${playlist.name}”?`,
    message: 'The playlist is removed. Its songs stay in your library.',
    action: 'Delete playlist',
  });
  if (!ok) return;
  const wasOpen = view.current === 'playlist' && view.playlistId === playlist.id;
  await playlists.delete(playlist.id);
  toast.show(`Deleted ${playlist.name}.`);
  if (wasOpen) location.hash = '#library';
}
</script>

<button
  bind:this={button}
  class="more"
  class:small
  type="button"
  popovertarget={menuId}
  aria-label="More for {playlist.name}"
  title="More"
>
  <Icon name="more" size={small ? 16 : 20} />
</button>
<div
  bind:this={menu}
  id={menuId}
  class="menu"
  popover="auto"
  role="menu"
  ontoggle={(e) => e.newState === 'open' && button && menu && placeMenu(button, menu)}
>
  <button type="button" role="menuitem" onclick={rename}>
    <Icon name="settings" size={18} />Rename
  </button>
  <button type="button" role="menuitem" class="danger" onclick={remove}>
    <Icon name="close" size={18} />Delete playlist
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
  background: var(--surface);
  color: var(--text);
}

.more.small {
  width: 28px;
  height: 28px;
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
  width: 13rem;
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
  border-radius: 8px;
  background: none;
  font-weight: 550;
  text-align: start;
}

.menu button:hover,
.menu button:focus-visible {
  background: var(--surface-strong);
}

.menu .danger :global(svg) {
  color: #e5484d;
}
</style>
