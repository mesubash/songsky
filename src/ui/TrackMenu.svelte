<script lang="ts">
import { library } from '$lib/library/library.svelte';
import type { Track } from '$lib/library/types';
import { player } from '$lib/player/player.svelte';
import { playlists } from '$lib/playlists/playlists.svelte';
import { toast } from '$lib/toast.svelte';
import { playlistHref } from '$lib/view.svelte';
import Icon from './Icon.svelte';
import { placeMenu } from './menu';

/** The ⋯ menu on a song: Play next, Add to queue, Add to playlist (and Remove, where
    the list allows it). Uses the browser's popover, so clicking outside or pressing
    Escape closes it. */
let {
  track,
  onremove,
  removeLabel = 'Remove',
}: { track: Track; onremove?: (track: Track) => void; removeLabel?: string } = $props();

let button = $state<HTMLButtonElement>();
let menu = $state<HTMLDivElement>();
/** The main list, or the list of playlists to add to. */
let page = $state<'main' | 'playlists'>('main');
const menuId = $props.id();

function place() {
  if (button && menu) placeMenu(button, menu);
}

function ontoggle(event: ToggleEvent) {
  if (event.newState !== 'open') {
    page = 'main';
    return;
  }
  place();
}

function showPlaylists() {
  page = 'playlists';
  requestAnimationFrame(place);
}

function done(message: string) {
  menu?.hidePopover();
  toast.show(message);
}

/** Discover songs join the library first, so the playlist can always play them. */
async function ensureSaved() {
  if (track.source === 'stream' && !library.isSaved(track.id)) await library.save(track);
}

async function addTo(id: string, name: string) {
  await ensureSaved();
  const added = await playlists.add(id, track.id);
  done(added ? `Added ${track.title} to ${name}.` : `${track.title} is already in ${name}.`);
}

async function addToNew() {
  await ensureSaved();
  const playlist = await playlists.create([track.id]);
  menu?.hidePopover();
  toast.show(`Made ${playlist.name} with ${track.title}.`);
  location.hash = playlistHref(playlist.id);
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
<div bind:this={menu} id={menuId} class="menu" popover="auto" role="menu" {ontoggle}>
  {#if page === 'main'}
    <button
      type="button"
      role="menuitem"
      onclick={() => {
        player.playNextUp(track.id);
        done(`${track.title} plays next.`);
      }}
    >
      <Icon name="play-next" size={18} />Play next
    </button>
    <button
      type="button"
      role="menuitem"
      onclick={() => {
        player.addToQueue(track.id);
        done(`Added ${track.title} to the queue.`);
      }}
    >
      <Icon name="queue" size={18} />Add to queue
    </button>
    <button type="button" role="menuitem" aria-haspopup="menu" onclick={showPlaylists}>
      <Icon name="plus" size={18} />Add to playlist
    </button>
    {#if onremove}
      <button
        type="button"
        role="menuitem"
        onclick={() => {
          menu?.hidePopover();
          onremove(track);
        }}
      >
        <Icon name="close" size={18} />{removeLabel}
      </button>
    {/if}
  {:else}
    <button type="button" role="menuitem" class="back" onclick={() => (page = 'main')}>
      <Icon name="chevron-down" size={18} />Add to playlist
    </button>
    <button type="button" role="menuitem" onclick={addToNew}>
      <Icon name="plus" size={18} />New playlist
    </button>
    {#each playlists.list as playlist (playlist.id)}
      <button type="button" role="menuitem" onclick={() => addTo(playlist.id, playlist.name)}>
        <Icon name="music" size={18} /><span class="label">{playlist.name}</span>
      </button>
    {/each}
  {/if}
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
  width: 15rem;
  max-height: min(24rem, calc(100dvh - 16px));
  margin: 0;
  padding: var(--space-1);
  overflow-y: auto;
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

/* The back row points left, like a breadcrumb. */
.back {
  color: var(--text-muted);
}

.back :global(svg) {
  transform: rotate(90deg);
}

.label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
