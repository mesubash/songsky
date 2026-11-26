<script lang="ts">
import { EQ_PRESETS, type EqPresetId } from '$lib/audio/eq';
import { CROSSFADE_MAX, sound } from '$lib/audio/sound.svelte';
import { SHORTCUTS } from '$lib/keys/shortcuts';
import { library } from '$lib/library/library.svelte';
import { memory } from '$lib/memory/memory.svelte';
import { player } from '$lib/player/player.svelte';
import { playlists } from '$lib/playlists/playlists.svelte';
import { sky } from '$lib/sky/sky.svelte';
import { toast } from '$lib/toast.svelte';
import Button from './Button.svelte';
import RememberSwitch from './RememberSwitch.svelte';

/** Everything you can set up, in one page. Changes save as you make them. */

const presets = Object.entries(EQ_PRESETS) as [EqPresetId, (typeof EQ_PRESETS)[EqPresetId]][];

const skyNow = $derived(
  sky.source === 'location'
    ? `Following the weather where you are${sky.place ? ` (${sky.place.name})` : ''}.`
    : sky.source === 'city'
      ? `Following the weather in ${sky.place?.name}.`
      : 'Following the time of day only. No location is used.',
);

/** How much this browser lets Songsky store, and whether it's protected from cleanup. */
let storage = $state<{ used: number; quota: number } | null>(null);
let persisted = $state(false);

$effect(() => {
  void navigator.storage?.estimate?.().then((estimate) => {
    storage = { used: estimate.usage ?? 0, quota: estimate.quota ?? 0 };
  });
  void navigator.storage?.persisted?.().then((value) => {
    persisted = value;
  });
});

const megabytes = (bytes: number) =>
  bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / 1e6))} MB`;

async function keepSafe() {
  persisted = (await navigator.storage?.persist?.()) ?? false;
  toast.show(
    persisted
      ? 'Your library is protected from automatic cleanup.'
      : 'The browser said no. Installing Songsky as an app usually allows it.',
  );
}

function clearHistory() {
  if (!confirm('Delete your listening history and places? Your songs and playlists stay.')) return;
  void memory.clearHistory();
  toast.show('Listening history deleted.');
}

function clearLibrary() {
  if (
    !confirm('Remove all songs and playlists from Songsky? Files on your device are not deleted.')
  )
    return;
  player.pause();
  void library.clear();
  memory.forget();
  playlists.forget();
  toast.show('Library cleared.');
}
</script>

<section class="settings" aria-labelledby="settings-title">
  <div class="desktop-title head">
    <h2 id="settings-title" class="title">Settings</h2>
  </div>

  <section class="group" aria-labelledby="set-sky">
    <h3 id="set-sky">Sky and weather</h3>
    <p class="help">The colours, the logo and Discover’s picks follow your sky. {skyNow}</p>
    <div class="row-actions">
      <Button
        icon="pin"
        variant={sky.source === 'location' ? 'primary' : undefined}
        onclick={() => sky.useLocation()}
        >Use my location</Button
      >
      <Button
        variant={sky.source === 'city' ? 'primary' : undefined}
        onclick={() => (sky.panelOpen = true)}
        >Choose a city</Button
      >
      <Button
        variant={sky.source === 'time' ? 'primary' : undefined}
        onclick={() => sky.useTimeOnly()}
        >Time of day only</Button
      >
    </div>
    {#if sky.error}
      <p class="help warn">{sky.error}</p>
    {/if}
  </section>

  <section class="group" aria-labelledby="set-sound">
    <h3 id="set-sound">Sound</h3>
    {#if player.effectsAvailable}
      <div class="setting">
        <label for="set-crossfade">Crossfade</label>
        <output for="set-crossfade"
          >{sound.crossfade === 0 ? 'Off' : `${sound.crossfade} s`}</output
        >
      </div>
      <input
        id="set-crossfade"
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
      <p class="help">Songs overlap at the end so there’s no silence between them.</p>

      <p class="label">Equalizer</p>
      <div class="chips">
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
        {#if !sound.preset}
          <span class="chip custom" aria-current="true">Custom</span>
        {/if}
      </div>
      <p class="help">Fine-tune each band from Sound settings in the player bar.</p>
      <div>
        <Button variant="quiet" disabled={sound.isDefault} onclick={() => sound.reset()}
          >Reset sound</Button
        >
      </div>
    {:else}
      <p class="help">
        On iPhone and iPad, crossfade and the equalizer are off so music keeps playing when the
        screen locks.
      </p>
    {/if}
  </section>

  <section class="group" aria-labelledby="set-memories">
    <h3 id="set-memories">Memories</h3>
    <RememberSwitch />
    <p class="help">
      Pins each song to the town where you played it, on a map in Memories. Places stay on this
      device.
    </p>
  </section>

  <section class="group" aria-labelledby="set-data">
    <h3 id="set-data">Your library and data</h3>
    <p class="help">
      {library.tracks.length}
      {library.tracks.length === 1 ? 'song' : 'songs'}, {playlists.list.length}
      {playlists.list.length === 1 ? 'playlist' : 'playlists'}, {memory.plays.length}
      {memory.plays.length === 1 ? 'play' : 'plays'} in your history{storage
        ? `. Using ${megabytes(storage.used)} of ${megabytes(storage.quota)} this browser allows.`
        : '.'}
      Everything stays on this device; there is no account.
    </p>
    <div class="row-actions">
      {#if !persisted}
        <Button onclick={keepSafe}>Protect from automatic cleanup</Button>
      {:else}
        <span class="ok">Protected from automatic cleanup</span>
      {/if}
      <Button variant="quiet" disabled={!memory.plays.length} onclick={clearHistory}
        >Delete listening history</Button
      >
      <Button variant="quiet" disabled={!library.tracks.length} onclick={clearLibrary}
        >Clear library</Button
      >
    </div>
  </section>

  <section class="group" aria-labelledby="set-keys">
    <h3 id="set-keys">Keyboard shortcuts</h3>
    <dl class="keys">
      {#each SHORTCUTS as shortcut (shortcut.label)}
        <div class="key-row">
          <dt>{shortcut.label}</dt>
          <dd>
            {#each shortcut.keys as key, i (key)}
              {#if i > 0 && shortcut.keys[0] !== 'Shift'}
                <span class="or">or</span>
              {/if}
              <kbd>{key}</kbd>
            {/each}
          </dd>
        </div>
      {/each}
    </dl>
  </section>

  <section class="group" aria-labelledby="set-about">
    <h3 id="set-about">About</h3>
    <p class="help">
      Songsky is free and open source. Music in Discover comes from independent artists on
      <a href="https://audius.co" target="_blank" rel="noopener noreferrer">Audius</a>. Weather from
      <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">Open-Meteo</a>,
      town names from
      <a href="https://www.bigdatacloud.com" target="_blank" rel="noopener noreferrer"
        >BigDataCloud</a
      >, maps from
      <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer"
        >OpenStreetMap</a
      >.
    </p>
    <p class="help">
      <a href="https://github.com/mesubash/songsky" target="_blank" rel="noopener noreferrer"
        >Source code on GitHub</a
      >
    </p>
  </section>
</section>

<style>
.settings {
  display: grid;
  /* Two columns of cards on wide screens, one on phones. */
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 26rem), 1fr));
  align-items: start;
  gap: var(--space-4);
  padding-bottom: var(--space-8);
}

.head {
  grid-column: 1 / -1;
  padding-top: var(--space-8);
}

.title {
  font-size: var(--text-2xl);
  letter-spacing: -0.02em;
}

.group {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

h3 {
  font-size: var(--text-lg);
  letter-spacing: -0.01em;
}

.help {
  max-width: 60ch;
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.help a {
  color: var(--text);
}

.warn {
  color: var(--text);
  font-weight: 550;
}

.row-actions,
.chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.setting {
  display: flex;
  justify-content: space-between;
}

.setting label,
.label {
  font-weight: 600;
}

output {
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
}

.chip {
  display: grid;
  place-items: center;
  min-height: 36px;
  padding: 0 var(--space-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: none;
  font-size: var(--text-sm);
  font-weight: 550;
}

.chip:hover {
  background: var(--surface-strong);
}

.chip[aria-pressed="true"],
.chip.custom {
  border-color: transparent;
  background: var(--accent);
  color: var(--on-accent);
}

.ok {
  color: var(--text);
  font-size: var(--text-sm);
  font-weight: 600;
}

.keys {
  display: grid;
  margin: 0;
}

.key-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  min-height: 40px;
  border-bottom: 1px solid var(--line);
  font-size: var(--text-sm);
}

dd {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin: 0;
}

kbd {
  min-width: 28px;
  padding: 2px var(--space-2);
  border: 1px solid var(--line);
  border-bottom-width: 2px;
  border-radius: 6px;
  background: var(--surface);
  font-family: var(--font-sans);
  text-align: center;
}

.or {
  color: var(--text-muted);
}

/* Desktop: the title is in the top bar. */
@media (min-width: 1100px) {
  .settings {
    padding-top: var(--space-6);
  }
}

/* The keyboard list is for computers; phones hide it. */
@media (pointer: coarse) {
  .group:has(#set-keys) {
    display: none;
  }
}
</style>
