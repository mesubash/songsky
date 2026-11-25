<script lang="ts">
import { player } from '$lib/player/player.svelte';
import Button from './Button.svelte';
import Controls from './Controls.svelte';
import Cover from './Cover.svelte';
import SeekBar from './SeekBar.svelte';
import VolumeControl from './VolumeControl.svelte';

let { onexpand }: { onexpand: () => void } = $props();

const progress = $derived(player.duration ? (player.position / player.duration) * 100 : 0);
</script>

{#if player.current}
  {@const track = player.current}
  <section class="bar" aria-label="Now playing">
    <div class="mini-progress" style:width="{progress}%"></div>

    <button class="now" type="button" onclick={onexpand} aria-label="Open player: {track.title}">
      <Cover coverId={track.coverId} size={52} />
      <span class="text">
        <span class="title">{track.title}</span>
        <span class="artist">{track.artist}</span>
      </span>
    </button>

    <div class="center">
      <Controls />
      <SeekBar />
    </div>

    <div class="side">
      <VolumeControl />
    </div>

    <div class="mobile-actions">
      <Button
        variant="icon"
        icon={player.playing ? 'pause' : 'play'}
        iconSize={24}
        aria-label={player.playing ? 'Pause' : 'Play'}
        onclick={() => player.toggle()}
      />
      <Button
        variant="icon"
        icon="next"
        iconSize={22}
        aria-label="Next"
        onclick={() => player.next()}
      />
    </div>
  </section>
{/if}

<style>
.bar {
  position: fixed;
  inset: auto 0 0;
  z-index: 10;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr);
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-3) var(--space-6);
  padding-bottom: max(var(--space-3), env(safe-area-inset-bottom));
  border-top: 1px solid var(--line);
  background: color-mix(in srgb, var(--sky-top) 78%, transparent);
  backdrop-filter: blur(24px) saturate(1.4);
}

.mini-progress {
  display: none;
}

.now {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  text-align: start;
}

.text {
  display: grid;
  min-width: 0;
}

.title,
.artist {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title {
  font-weight: 600;
}

.artist {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.center {
  display: grid;
  justify-items: center;
  gap: var(--space-1);
  max-width: 640px;
  width: 100%;
  justify-self: center;
}

.side {
  display: flex;
  justify-content: flex-end;
}

.mobile-actions {
  display: none;
}

@media (max-width: 720px) {
  .bar {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    padding-bottom: max(var(--space-2), env(safe-area-inset-bottom));
  }

  .center,
  .side {
    display: none;
  }

  .mobile-actions {
    display: flex;
  }

  .mini-progress {
    display: block;
    position: absolute;
    inset: -1px auto auto 0;
    height: 2px;
    background: var(--accent);
  }
}
</style>
