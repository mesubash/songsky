<script lang="ts">
import { canShareFile, createSongArt, downloadFile, shareFile } from '$lib/art/art.svelte';
import type { Track } from '$lib/library/types';
import { toast } from '$lib/toast.svelte';
import Button from './Button.svelte';
import { modal } from './modal';

/** Song art: a preview of the picture, then share it, save it, or copy the song's link. */
let { open = $bindable(false), track }: { open?: boolean; track: Track | null } = $props();

let file = $state<File | null>(null);
let preview = $state<string | null>(null);
let failed = $state(false);

// Draw a fresh picture each time the sheet opens (the sky may have changed).
$effect(() => {
  if (!open || !track) return;
  let alive = true;
  file = null;
  failed = false;
  createSongArt(track)
    .then((made) => {
      if (!alive) return;
      file = made;
      preview = URL.createObjectURL(made);
    })
    .catch(() => {
      if (alive) failed = true;
    });
  return () => {
    alive = false;
    if (preview) URL.revokeObjectURL(preview);
    preview = null;
  };
});

const shareable = $derived(file ? canShareFile(file) : false);

async function share() {
  if (!file || !track) return;
  try {
    if (await shareFile(file, track.title)) open = false;
  } catch {
    toast.show('Sharing didn’t work here. Download the image instead.');
  }
}

async function copyLink() {
  if (!track?.link) return;
  try {
    await navigator.clipboard.writeText(track.link);
    toast.show('Song link copied.');
  } catch {
    toast.show('Couldn’t copy the link.');
  }
}

function closeOnBackdrop(event: MouseEvent) {
  if (event.target === event.currentTarget) open = false;
}
</script>

<!-- biome-ignore lint/a11y/useKeyWithClickEvents: Escape already closes the native dialog; this only handles backdrop clicks. -->
<dialog
  class="sheet"
  use:modal={open}
  aria-labelledby="art-title"
  onclose={() => (open = false)}
  onclick={closeOnBackdrop}
>
  <div class="content">
    <header>
      <h2 id="art-title">Song art</h2>
      <Button variant="icon" icon="close" aria-label="Close" onclick={() => (open = false)} />
    </header>

    <div class="preview" aria-busy={!preview}>
      {#if preview}
        <img
          src={preview}
          alt="Song art for {track?.title}: your sky, the song’s shape and its title"
        >
      {:else if failed}
        <p>Couldn’t draw the picture. Close this and try again.</p>
      {:else}
        <span class="drawing">Drawing your song art…</span>
      {/if}
    </div>

    <div class="actions">
      {#if shareable}
        <Button variant="primary" icon="share" disabled={!file} onclick={share}>Share…</Button>
      {/if}
      <Button
        variant={shareable ? 'quiet' : 'primary'}
        icon="download"
        disabled={!file}
        onclick={() => file && downloadFile(file)}
        >Download image</Button
      >
      {#if track?.link}
        <Button icon="copy" onclick={copyLink}>Copy song link</Button>
      {/if}
    </div>
  </div>
</dialog>

<style>
.sheet {
  width: min(100% - 2rem, 30rem);
  max-height: calc(100dvh - 2rem);
  margin: auto; /* The global reset removes the dialog's default centering. */
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--sky-top) 92%, var(--text));
  color: var(--text);
}

.sheet::backdrop {
  background: rgb(0 0 0 / 0.45);
}

.sheet[open] {
  animation: appear 220ms var(--ease-out);
}

.content {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-6) var(--space-6);
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-inline-end: calc(var(--space-3) * -1);
}

h2 {
  font-size: var(--text-xl);
  letter-spacing: -0.02em;
}

/* Same shape as the picture (1080 × 1350), so nothing jumps when it appears. */
.preview {
  display: grid;
  place-items: center;
  aspect-ratio: 1080 / 1350;
  max-height: 56vh;
  margin-inline: auto;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text-muted);
  text-align: center;
}

.preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.drawing {
  animation: pulse 1.2s ease-in-out infinite alternate;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

@keyframes appear {
  from {
    transform: translateY(12px) scale(0.98);
    opacity: 0;
  }
}

@keyframes pulse {
  from {
    opacity: 0.4;
  }
}
</style>
