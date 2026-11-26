<script lang="ts">
import { library } from '$lib/library/library.svelte';
import { player } from '$lib/player/player.svelte';
import { sleep } from '$lib/sleep/sleep.svelte';
import Button from './Button.svelte';
import Controls from './Controls.svelte';
import Cover from './Cover.svelte';
import Icon from './Icon.svelte';
import SeekBar from './SeekBar.svelte';
import VolumeControl from './VolumeControl.svelte';

let { onexpand, onsound }: { onexpand: () => void; onsound: () => void } = $props();

const progress = $derived(player.duration ? (player.position / player.duration) * 100 : 0);
</script>

{#if player.current}
  {@const track = player.current}
  <section class="bar" aria-label="Now playing">
    <div class="mini-progress" style:width="{progress}%"></div>

    <div class="now-wrap">
      <button class="now" type="button" onclick={onexpand} aria-label="Open player: {track.title}">
        <Cover coverId={track.coverId} artworkUrl={track.artworkUrl} size={52} />
        <span class="text">
          <span class="title">{track.title}</span>
          <span class="artist">{track.artist}</span>
        </span>
      </button>
      {#if track.source === 'stream'}
        {@const saved = library.isSaved(track.id)}
        <button
          class="save"
          class:on={saved}
          type="button"
          aria-pressed={saved}
          aria-label={saved
            ? `Remove ${track.title} from your library`
            : `Save ${track.title} to your library`}
          title={saved ? 'Saved to your library' : 'Save to your library'}
          onclick={() => (saved ? library.remove(track.id) : library.save(track))}
        >
          <Icon name="heart" size={18} />
        </button>
      {/if}
    </div>

    <div class="center">
      <Controls />
      <SeekBar />
    </div>

    <div class="side">
      {#if sleep.active}
        <Button
          variant="icon"
          icon="moon"
          iconSize={18}
          active
          aria-label="Sleep timer is on"
          title="Sleep timer is on"
          onclick={onsound}
        />
      {/if}
      <Button
        variant="icon"
        icon="sliders"
        iconSize={18}
        aria-label="Sound settings"
        onclick={onsound}
      />
      {#if player.effectsAvailable}
        <VolumeControl />
      {/if}
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
  /* Full-width background, but contents line up with the page content's edges. */
  padding-block: var(--space-3);
  padding-inline: max(var(--gutter), calc((100% - var(--content-max)) / 2));
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

.now-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.now-wrap .now {
  flex: 1;
}

.save {
  flex: none;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--text-muted);
}

.save:hover {
  background: var(--surface);
  color: var(--text);
}

.save.on {
  color: var(--accent);
}

.save.on :global(path) {
  fill: currentColor;
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

.mobile-actions :global(.icon) {
  color: var(--text);
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

/* Desktop: the bar spans the sidebar too, so it uses plain gutters. */
@media (min-width: 1100px) {
  .bar {
    padding-inline: var(--gutter);
  }
}
</style>
