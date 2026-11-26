<script lang="ts">
import { EQ_PRESETS, type EqPresetId } from '$lib/audio/eq';
import { CROSSFADE_MAX, sound } from '$lib/audio/sound.svelte';
import { ask } from '$lib/confirm.svelte';
import { SHORTCUTS } from '$lib/keys/shortcuts';
import { library } from '$lib/library/library.svelte';
import { memory } from '$lib/memory/memory.svelte';
import { player } from '$lib/player/player.svelte';
import { playlists } from '$lib/playlists/playlists.svelte';
import { sky } from '$lib/sky/sky.svelte';
import { toast } from '$lib/toast.svelte';
import { playlistHref } from '$lib/view.svelte';
import Button from './Button.svelte';
import RememberSwitch from './RememberSwitch.svelte';

/** Everything you can set up, in one page: a list of sections on the left (desktop), and
    rows with a name, a short explanation and the control on the right. Changes save as
    you make them. */

const SECTIONS = [
  { id: 'set-sky', label: 'Sky and weather' },
  { id: 'set-sound', label: 'Sound' },
  { id: 'set-playlists', label: 'Playlists' },
  { id: 'set-memories', label: 'Memories' },
  { id: 'set-storage', label: 'Storage' },
  { id: 'set-keys', label: 'Keyboard shortcuts' },
  { id: 'set-danger', label: 'Your data' },
  { id: 'set-about', label: 'About' },
];

const presets = Object.entries(EQ_PRESETS) as [EqPresetId, (typeof EQ_PRESETS)[EqPresetId]][];

const skyNow = $derived(
  sky.source === 'location'
    ? `Following the weather where you are${sky.place ? `, ${sky.place.name}` : ''}.`
    : sky.source === 'city'
      ? `Following the weather in ${sky.place?.name}.`
      : 'Following the time of day only. No location is used.',
);

const songCount = (trackIds: string[]) => trackIds.filter((id) => library.byId.has(id)).length;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

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

const size = (bytes: number) =>
  bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / 1e6))} MB`;

async function keepSafe() {
  persisted = (await navigator.storage?.persist?.()) ?? false;
  toast.show(
    persisted
      ? 'Your library is protected from automatic cleanup.'
      : 'The browser said no. Installing Songsky as an app usually allows it.',
  );
}

/** Renaming happens in place: the name turns into a text box. */
let renaming = $state<string | null>(null);
let draft = $state('');

function startRename(id: string, name: string) {
  renaming = id;
  draft = name;
}

function finishRename() {
  if (renaming) void playlists.rename(renaming, draft);
  renaming = null;
}

function focusAndSelect(node: HTMLInputElement) {
  node.focus();
  node.select();
}

async function newPlaylist() {
  const playlist = await playlists.create();
  startRename(playlist.id, playlist.name);
}

async function deletePlaylist(id: string, name: string) {
  const ok = await ask({
    title: `Delete “${name}”?`,
    message: 'The playlist is removed. Its songs stay in your library.',
    action: 'Delete playlist',
  });
  if (!ok) return;
  void playlists.delete(id);
  toast.show(`Deleted ${name}.`);
}

async function clearHistory() {
  const ok = await ask({
    title: 'Delete listening history?',
    message: `${plural(memory.plays.length, 'play')}, Recently played and the places on your map are removed. Songs and playlists stay.`,
    action: 'Delete history',
  });
  if (!ok) return;
  void memory.clearHistory();
  toast.show('Listening history deleted.');
}

async function deleteAllPlaylists() {
  const ok = await ask({
    title: `Delete all ${plural(playlists.list.length, 'playlist')}?`,
    message: 'Every playlist is removed. The songs stay in your library.',
    action: 'Delete all',
  });
  if (!ok) return;
  for (const playlist of playlists.list) void playlists.delete(playlist.id);
  toast.show('All playlists deleted.');
}

async function clearLibrary() {
  const ok = await ask({
    title: 'Clear your library?',
    message:
      'Every song, playlist and play is removed from Songsky. Music files on your device are not touched.',
    action: 'Clear library',
  });
  if (!ok) return;
  player.pause();
  void library.clear();
  memory.forget();
  playlists.forget();
  toast.show('Library cleared.');
}

/** The section being read, highlighted in the list on the left as you scroll. */
let active = $state(SECTIONS[0]?.id ?? '');
/** A clicked section stays highlighted while the page scrolls to it. */
let clickedAt = 0;
const settling = () => Date.now() - clickedAt < 1200;

$effect(() => {
  const headings = SECTIONS.flatMap((s) => document.getElementById(s.id) ?? []);
  // A heading counts as "current" once it passes just under the top bar.
  const observer = new IntersectionObserver(
    () => {
      if (settling()) return;
      const passed = headings.filter((h) => h.getBoundingClientRect().top < innerHeight * 0.35);
      const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
      active = (atBottom ? headings.at(-1) : passed.at(-1))?.id ?? SECTIONS[0]?.id ?? '';
    },
    { rootMargin: '-80px 0px -60% 0px', threshold: [0, 1] },
  );
  for (const heading of headings) observer.observe(heading);
  const onScroll = () => {
    if (settling()) return;
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) {
      active = headings.at(-1)?.id ?? active;
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  return () => {
    observer.disconnect();
    removeEventListener('scroll', onScroll);
  };
});

function jumpTo(event: MouseEvent, id: string) {
  event.preventDefault();
  active = id;
  clickedAt = Date.now();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>

<div class="settings">
  <h2 id="settings-title" class="desktop-title page-title">Settings</h2>

  <nav class="index" aria-label="Settings sections">
    <ul>
      {#each SECTIONS as section (section.id)}
        <li>
          <a
            href="#settings"
            aria-current={active === section.id ? 'location' : undefined}
            onclick={(e) => jumpTo(e, section.id)}
            >{section.label}</a
          >
        </li>
      {/each}
    </ul>
  </nav>

  <div class="sections">
    <section aria-labelledby="set-sky">
      <h3 id="set-sky">Sky and weather</h3>
      <div class="rows">
        <div class="row stack">
          <div class="text">
            <p class="name">Where your sky comes from</p>
            <p class="desc">The colours, the logo and Discover’s picks follow it. {skyNow}</p>
          </div>
          <fieldset class="segmented">
            <legend class="visually-hidden">Sky source</legend>
            <button
              type="button"
              aria-pressed={sky.source === 'location'}
              onclick={() => sky.useLocation()}
            >
              My location
            </button>
            <button
              type="button"
              aria-pressed={sky.source === 'city'}
              onclick={() => (sky.panelOpen = true)}
            >
              {sky.source === 'city' && sky.place ? sky.place.name : 'A city'}
            </button>
            <button
              type="button"
              aria-pressed={sky.source === 'time'}
              onclick={() => sky.useTimeOnly()}
            >
              Time of day
            </button>
          </fieldset>
          {#if sky.error}
            <p class="desc warn">{sky.error}</p>
          {/if}
        </div>
      </div>
    </section>

    <section aria-labelledby="set-sound">
      <h3 id="set-sound">Sound</h3>
      {#if player.effectsAvailable}
        <div class="rows">
          <div class="row">
            <div class="text">
              <label class="name" for="set-crossfade">Crossfade</label>
              <p class="desc">Songs overlap at the end so there’s no silence between them.</p>
            </div>
            <div class="control slider">
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
              <output for="set-crossfade"
                >{sound.crossfade === 0 ? 'Off' : `${sound.crossfade} s`}</output
              >
            </div>
          </div>
          <div class="row stack">
            <div class="text">
              <p class="name">Equalizer</p>
              <p class="desc">Fine-tune each band from Sound settings in the player bar.</p>
            </div>
            <fieldset class="segmented">
              <legend class="visually-hidden">Equalizer preset</legend>
              {#each presets as [id, preset] (id)}
                <button
                  type="button"
                  aria-pressed={sound.preset === id}
                  onclick={() => sound.usePreset(id)}
                >
                  {preset.label}
                </button>
              {/each}
              {#if !sound.preset}
                <span class="custom">Custom</span>
              {/if}
            </fieldset>
          </div>
          <div class="row">
            <div class="text">
              <p class="name">Reset sound</p>
              <p class="desc">Back to a flat equalizer and a 4 second crossfade.</p>
            </div>
            <Button disabled={sound.isDefault} onclick={() => sound.reset()}>Reset</Button>
          </div>
        </div>
      {:else}
        <p class="note">
          On iPhone and iPad, crossfade and the equalizer are off so music keeps playing when the
          screen locks.
        </p>
      {/if}
    </section>

    <section aria-labelledby="set-playlists">
      <div class="section-head">
        <h3 id="set-playlists">Playlists</h3>
        <Button icon="plus" onclick={newPlaylist}>New playlist</Button>
      </div>
      {#if playlists.list.length}
        <ul class="rows">
          {#each playlists.list as playlist (playlist.id)}
            <li class="row">
              {#if renaming === playlist.id}
                <form
                  class="rename"
                  onsubmit={(e) => {
                    e.preventDefault();
                    finishRename();
                  }}
                >
                  <label class="visually-hidden" for="rename-{playlist.id}">Playlist name</label>
                  <input
                    id="rename-{playlist.id}"
                    bind:value={draft}
                    maxlength="80"
                    onblur={finishRename}
                    onkeydown={(e) => {
                      if (e.key === 'Escape') renaming = null;
                    }}
                    use:focusAndSelect
                  >
                </form>
              {:else}
                <div class="text">
                  <a class="name link" href={playlistHref(playlist.id)}>{playlist.name}</a>
                  <p class="desc">{plural(songCount(playlist.trackIds), 'song')}</p>
                </div>
              {/if}
              <div class="control">
                <Button variant="quiet" onclick={() => startRename(playlist.id, playlist.name)}
                  >Rename</Button
                >
                <Button variant="quiet" onclick={() => deletePlaylist(playlist.id, playlist.name)}
                  >Delete</Button
                >
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="note">No playlists yet. Make one here or from any song’s ⋯ menu.</p>
      {/if}
    </section>

    <section aria-labelledby="set-memories">
      <h3 id="set-memories">Memories</h3>
      <div class="rows">
        <div class="row">
          <div class="text">
            <p class="name">Remember where I listen</p>
            <p class="desc">
              Pins each song to the town where you played it, on a map in Memories. Places stay on
              this device.
            </p>
          </div>
          <RememberSwitch bare />
        </div>
      </div>
    </section>

    <section aria-labelledby="set-storage">
      <h3 id="set-storage">Storage</h3>
      <div class="rows">
        <div class="row">
          <div class="text">
            <p class="name">On this device</p>
            <p class="desc">
              {plural(library.tracks.length, 'song')}, {plural(playlists.list.length, 'playlist')},
              {plural(memory.plays.length, 'play')} in your history. There is no account; nothing
              leaves this device.
            </p>
          </div>
          {#if storage}
            <span class="value"
              >{size(storage.used)} <span class="of">of {size(storage.quota)}</span></span
            >
          {/if}
        </div>
        <div class="row">
          <div class="text">
            <p class="name">Protect from automatic cleanup</p>
            <p class="desc">
              Browsers may delete site data when the device runs low on space. This asks yours not
              to.
            </p>
          </div>
          {#if persisted}
            <span class="value">Protected</span>
          {:else}
            <Button onclick={keepSafe}>Protect</Button>
          {/if}
        </div>
      </div>
    </section>

    <section class="keys-section" aria-labelledby="set-keys">
      <h3 id="set-keys">Keyboard shortcuts</h3>
      <dl class="rows keys">
        {#each SHORTCUTS as shortcut (shortcut.label)}
          <div class="row">
            <dt class="key-label">{shortcut.label}</dt>
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

    <section aria-labelledby="set-danger">
      <h3 id="set-danger">Your data</h3>
      <div class="rows danger">
        <div class="row">
          <div class="text">
            <p class="name">Listening history</p>
            <p class="desc">Recently played, Memories and the map. Songs and playlists stay.</p>
          </div>
          <Button disabled={!memory.plays.length} onclick={clearHistory}>Delete</Button>
        </div>
        <div class="row">
          <div class="text">
            <p class="name">All playlists</p>
            <p class="desc">The songs stay in your library.</p>
          </div>
          <Button disabled={!playlists.list.length} onclick={deleteAllPlaylists}>Delete</Button>
        </div>
        <div class="row">
          <div class="text">
            <p class="name">Whole library</p>
            <p class="desc">
              Every song, playlist and play. Music files on your device are not touched.
            </p>
          </div>
          <Button disabled={!library.tracks.length} onclick={clearLibrary}>Clear</Button>
        </div>
      </div>
    </section>

    <section aria-labelledby="set-about">
      <h3 id="set-about">About</h3>
      <p class="note">
        Songsky is free and open source. Music in Discover comes from independent artists on
        <a href="https://audius.co" target="_blank" rel="noopener noreferrer">Audius</a>. Weather
        from
        <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">Open-Meteo</a>,
        town names from
        <a href="https://www.bigdatacloud.com" target="_blank" rel="noopener noreferrer"
          >BigDataCloud</a
        >, maps from
        <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer"
          >OpenStreetMap</a
        >.
        <a href="https://github.com/mesubash/songsky" target="_blank" rel="noopener noreferrer"
          >Source code on GitHub</a
        >.
      </p>
    </section>
  </div>
</div>

<style>
.settings {
  display: grid;
  gap: var(--space-8);
  padding-block: var(--space-8);
}

.page-title {
  font-size: var(--text-2xl);
  letter-spacing: -0.02em;
}

/* The section list is for wide screens; phones just scroll. */
.index {
  display: none;
}

.sections {
  display: grid;
  gap: var(--space-12);
  max-width: 60rem;
  min-width: 0;
}

section {
  display: grid;
  gap: var(--space-3);
  scroll-margin-top: 112px;
}

h3 {
  font-size: var(--text-lg);
  letter-spacing: -0.01em;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

/* One panel per section; rows inside are split by thin lines. */
.rows {
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
  list-style: none;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3) var(--space-6);
  min-height: 64px;
  padding: var(--space-4) var(--space-6);
}

.row + .row {
  border-top: 1px solid var(--line);
}

/* Rows whose control is wide (button groups) put it on its own line. */
.row.stack {
  flex-direction: column;
  align-items: stretch;
}

.text {
  flex: 1 1 18rem;
  display: grid;
  gap: 2px;
  min-width: 0;
}

.row.stack .text {
  flex: none;
}

.name {
  font-weight: 600;
}

.link {
  color: var(--text);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.desc,
.note,
.of,
.or,
output {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.desc {
  max-width: 52ch;
}

.warn {
  color: var(--text);
  font-weight: 550;
}

.note {
  max-width: 60ch;
}

.note a {
  color: var(--text);
}

.control {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.slider {
  flex: 0 1 16rem;
  gap: var(--space-3);
}

.slider .range {
  flex: 1;
}

output {
  min-width: 2.5rem;
  font-variant-numeric: tabular-nums;
  text-align: end;
}

.value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* A row of joined buttons where one is chosen, like a physical switch. */
.segmented {
  display: flex;
  min-width: 0;
  margin: 0;
  border: 0;
  flex-wrap: wrap;
  gap: 4px;
  width: fit-content;
  padding: 4px;
  border-radius: var(--radius-full);
  background: var(--surface-strong);
}

.segmented button,
.custom {
  min-height: 36px;
  padding: 0 var(--space-4);
  border: 0;
  border-radius: var(--radius-full);
  background: none;
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-weight: 600;
}

.segmented button:hover {
  color: var(--text);
}

.segmented button[aria-pressed="true"],
.custom {
  display: grid;
  place-items: center;
  background: var(--accent);
  color: var(--on-accent);
}

.rename {
  flex: 1 1 18rem;
}

.rename input {
  width: 100%;
  min-height: 40px;
  padding: 0 var(--space-3);
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-weight: 600;
}

.keys .row {
  min-height: 48px;
  padding-block: var(--space-2);
}

.key-label {
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
  font-size: var(--text-sm);
  text-align: center;
}

/* Deleting gets its own panel with a warm edge, so it reads as "careful". */
.danger {
  border-color: color-mix(in srgb, #c2410c 45%, var(--line));
}

/* Desktop: the title is in the top bar, and the section list sits on the left. */
@media (min-width: 1100px) {
  .settings {
    grid-template-columns: 13rem minmax(0, 60rem);
    align-items: start;
    gap: var(--space-12);
    padding-top: var(--space-6);
  }

  .index {
    position: sticky;
    top: 88px;
    display: block;
  }

  .index ul {
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .index a {
    display: block;
    transition:
      background-color var(--duration-fast) var(--ease-out),
      color var(--duration-fast) var(--ease-out);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    color: var(--text-muted);
    font-size: var(--text-sm);
    font-weight: 550;
    text-decoration: none;
  }

  .index a:hover {
    background: var(--surface);
    color: var(--text);
  }

  /* The section you're reading: filled, with a bar on the left like the main sidebar. */
  .index a[aria-current="location"] {
    position: relative;
    background: var(--surface-strong);
    color: var(--text);
    font-weight: 650;
  }

  .index a[aria-current="location"]::before {
    content: "";
    position: absolute;
    top: 8px;
    bottom: 8px;
    left: 0;
    width: 3px;
    border-radius: 3px;
    background: var(--accent);
  }
}

/* The keyboard list is for computers; touch screens hide it. */
@media (pointer: coarse) {
  .keys-section {
    display: none;
  }
}
</style>
