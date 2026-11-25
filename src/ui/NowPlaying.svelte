<script lang="ts">
import { player } from '$lib/player/player.svelte';
import Button from './Button.svelte';
import Controls from './Controls.svelte';
import Cover from './Cover.svelte';
import { modal } from './modal';
import SeekBar from './SeekBar.svelte';
import Visualizer from './Visualizer.svelte';

let { open = $bindable(false), onsound }: { open?: boolean; onsound: () => void } = $props();
</script>

<!-- Native dialog: focus is trapped and Escape closes it. -->
<dialog
  use:modal={open}
  class="now-playing"
  aria-label="Now playing"
  onclose={() => (open = false)}
>
  {#if player.current}
    {@const track = player.current}
    <div class="sheet">
      <header>
        <Button
          variant="icon"
          icon="chevron-down"
          iconSize={26}
          aria-label="Close player"
          onclick={() => (open = false)}
        />
        <Button
          variant="icon"
          icon="sliders"
          iconSize={22}
          aria-label="Sound settings"
          onclick={onsound}
        />
      </header>

      <div class="art">
        <Cover coverId={track.coverId} size={420} fluid />
      </div>

      <div class="horizon">
        {#if open && player.effectsAvailable}
          <Visualizer />
        {/if}
      </div>

      <div class="info">
        <h2 class="title">{track.title}</h2>
        <p class="artist">{track.artist}{track.album ? `, ${track.album}` : ''}</p>
      </div>

      <SeekBar />
      <Controls large />
    </div>
  {/if}
</dialog>

<style>
.now-playing {
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: linear-gradient(180deg, var(--sky-top), var(--sky-mid) 60%, var(--sky-horizon));
  color: var(--text);
}

.now-playing[open] {
  animation: rise 360ms var(--ease-out);
}

.now-playing::backdrop {
  background: transparent;
}

.sheet {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 460px;
  min-height: 100%;
  margin: 0 auto;
  padding: var(--space-4) var(--space-6);
  padding-top: max(var(--space-4), env(safe-area-inset-top));
  padding-bottom: max(var(--space-8), env(safe-area-inset-bottom));
}

header {
  display: flex;
  justify-content: space-between;
  margin-inline: calc(var(--space-3) * -1);
}

.horizon {
  height: 64px;
  margin-block: calc(var(--space-4) * -1);
}

.art {
  flex: 1;
  display: grid;
  align-items: center;
  width: min(100%, 52vh);
  margin: 0 auto;
}

.art :global(.cover) {
  box-shadow: 0 24px 60px -20px rgb(0 0 0 / 0.55);
}

.info {
  display: grid;
  gap: var(--space-1);
}

.title {
  font-size: var(--text-xl);
  font-variation-settings: "opsz" 48;
  letter-spacing: -0.02em;
}

.artist {
  color: var(--text-muted);
}

@keyframes rise {
  from {
    transform: translateY(8%);
    opacity: 0;
  }
}
</style>
