<script lang="ts">
import { EQ_BANDS, EQ_PRESETS, EQ_RANGE_DB, type EqPresetId } from '$lib/audio/eq';
import { CROSSFADE_MAX, sound } from '$lib/audio/sound.svelte';
import { player } from '$lib/player/player.svelte';
import Button from './Button.svelte';
import { modal } from './modal';

let { open = $bindable(false) }: { open?: boolean } = $props();

const presets = Object.entries(EQ_PRESETS) as [EqPresetId, (typeof EQ_PRESETS)[EqPresetId]][];
const formatGain = (db: number) => (db > 0 ? `+${db}` : `${db}`);

/** Fill grows from the 0 dB line to the value, up or down. */
function fillFor(db: number): string {
  const value = ((db + EQ_RANGE_DB) / (EQ_RANGE_DB * 2)) * 100;
  return `--lo: ${Math.min(50, value)}%; --hi: ${Math.max(50, value)}%`;
}

/** Clicking the dimmed area outside the panel closes it. */
function closeOnBackdrop(event: MouseEvent) {
  if (event.target === event.currentTarget) open = false;
}
</script>

<!-- biome-ignore lint/a11y/useKeyWithClickEvents: Escape already closes the native dialog; this only handles backdrop clicks. -->
<dialog
  use:modal={open}
  class="panel"
  aria-labelledby="sound-title"
  onclose={() => (open = false)}
  onclick={closeOnBackdrop}
>
  <div class="content">
    <header>
      <h2 id="sound-title">Sound</h2>
      <Button
        variant="icon"
        icon="close"
        aria-label="Close sound settings"
        onclick={() => (open = false)}
      />
    </header>

    {#if player.effectsAvailable}
      <section class="group">
        <div class="row">
          <label for="crossfade">Crossfade</label>
          <output for="crossfade">{sound.crossfade === 0 ? 'Off' : `${sound.crossfade} s`}</output>
        </div>
        <input
          id="crossfade"
          class="range"
          type="range"
          min="0"
          max={CROSSFADE_MAX}
          step="1"
          value={sound.crossfade}
          style:--fill="{(sound.crossfade / CROSSFADE_MAX) * 100}%"
          aria-valuetext={sound.crossfade === 0 ? 'Off' : `${sound.crossfade} seconds`}
          oninput={(e) => sound.setCrossfade(e.currentTarget.valueAsNumber)}
        >
        <p class="help">Songs overlap at the end so there's no silence between them.</p>
      </section>

      <section class="group" aria-labelledby="eq-title">
        <h3 id="eq-title">Equalizer</h3>
        <fieldset class="presets">
          <legend class="visually-hidden">Presets</legend>
          {#each presets as [id, preset] (id)}
            <button
              type="button"
              class="chip"
              aria-pressed={sound.preset === id}
              onclick={() => sound.usePreset(id)}
            >
              {preset.label}
            </button>
          {/each}
        </fieldset>

        <div class="bands">
          {#each EQ_BANDS as band, i (band.frequency)}
            {@const gain = sound.eq[i] ?? 0}
            <div class="band">
              <span class="gain">{formatGain(gain)}</span>
              <input
                class="vertical"
                type="range"
                min={-EQ_RANGE_DB}
                max={EQ_RANGE_DB}
                step="1"
                value={gain}
                style={fillFor(gain)}
                aria-label={band.label}
                aria-valuetext="{formatGain(gain)} decibels"
                oninput={(e) => sound.setBand(i, e.currentTarget.valueAsNumber)}
              >
              <span class="freq">{band.label}</span>
            </div>
          {/each}
        </div>
      </section>
    {:else}
      <p class="help">
        On iPhone and iPad, crossfade and the equalizer are off so music keeps playing when the
        screen locks. Use the volume buttons on your device to change the volume.
      </p>
    {/if}
  </div>
</dialog>

<style>
.panel {
  width: min(100% - 2rem, 26rem);
  margin: auto; /* The global reset removes the dialog's default centering. */
  max-height: calc(100dvh - 2rem);
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--sky-top) 92%, var(--text));
  color: var(--text);
}

.panel::backdrop {
  background: rgb(0 0 0 / 0.4);
}

.panel[open] {
  animation: appear 220ms var(--ease-out);
}

.content {
  display: grid;
  gap: var(--space-8);
  padding: var(--space-4) var(--space-6) var(--space-8);
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

h3,
label {
  font-size: var(--text-base);
  font-weight: 600;
}

.group {
  display: grid;
  gap: var(--space-3);
}

.row {
  display: flex;
  justify-content: space-between;
}

output,
.help,
.gain,
.freq {
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
}

.presets {
  display: flex;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.chip {
  min-height: 36px;
  padding: 0 var(--space-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: none;
  font-size: var(--text-sm);
  font-weight: 550;
}

.chip:hover {
  background: var(--surface);
}

.chip[aria-pressed="true"] {
  border-color: transparent;
  background: var(--accent);
  color: var(--on-accent);
}

.bands {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-2);
  padding-top: var(--space-2);
}

.band {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
}

/* Vertical slider: fill runs from the 0 dB midline to the current value. */
.vertical {
  --track: 4px;

  width: 28px;
  height: 140px;
  margin: 0;
  background: transparent;
  appearance: none;
  writing-mode: vertical-lr;
  direction: rtl;
  cursor: pointer;
}

.vertical::-webkit-slider-runnable-track {
  width: var(--track);
  border-radius: var(--radius-full);
  background: linear-gradient(
    to top,
    var(--line) var(--lo),
    var(--accent) var(--lo) var(--hi),
    var(--line) var(--hi)
  );
}

.vertical::-moz-range-track {
  width: var(--track);
  border-radius: var(--radius-full);
  background: linear-gradient(
    to top,
    var(--line) var(--lo),
    var(--accent) var(--lo) var(--hi),
    var(--line) var(--hi)
  );
}

.vertical::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
  margin-left: calc((var(--track) - 16px) / 2);
  border-radius: 50%;
  background: var(--text);
  appearance: none;
}

.vertical::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border: 0;
  border-radius: 50%;
  background: var(--text);
}

@keyframes appear {
  from {
    transform: translateY(12px) scale(0.98);
    opacity: 0;
  }
}
</style>
