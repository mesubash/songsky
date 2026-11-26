<script lang="ts">
import { EQ_PRESETS, type EqPresetId } from '$lib/audio/eq';
import { CROSSFADE_MAX, sound } from '$lib/audio/sound.svelte';
import { type Backup, parseBackup } from '$lib/backup/backup';
import { downloadBackup, previewRestore, restoreBackup } from '$lib/backup/restore';
import { ask } from '$lib/confirm.svelte';
import { jamendoAvailable } from '$lib/discover/jamendo';
import { SHORTCUTS } from '$lib/keys/shortcuts';
import { library } from '$lib/library/library.svelte';
import { memory } from '$lib/memory/memory.svelte';
import { installSteps } from '$lib/platform';
import { player } from '$lib/player/player.svelte';
import { playlists } from '$lib/playlists/playlists.svelte';
import { prefs } from '$lib/prefs.svelte';
import { pwa } from '$lib/pwa.svelte';
import { sky } from '$lib/sky/sky.svelte';
import { toast } from '$lib/toast.svelte';
import { playlistHref, view } from '$lib/view.svelte';
import Button from './Button.svelte';
import Icon, { type IconName } from './Icon.svelte';
import Logo from './Logo.svelte';
import Switch from './Switch.svelte';

/**
 * Settings, laid out like a system settings app: a list of sections with coloured icons,
 * and one section at a time. On desktop the list stays on the left; on phones the list is
 * its own screen and a section opens with a Back button. Each section has its own address
 * (#settings/sound), so Back and links work. Changes save as you make them.
 */

const SECTIONS: { id: string; label: string; icon: IconName; tint: string; hint: string }[] = [
  {
    id: 'sky',
    label: 'Sky and appearance',
    icon: 'sun',
    tint: '#f59e0b',
    hint: 'Weather, location, effects',
  },
  {
    id: 'sound',
    label: 'Sound',
    icon: 'sliders',
    tint: '#ef4444',
    hint: 'Crossfade and equalizer',
  },
  {
    id: 'music',
    label: 'Your music',
    icon: 'music',
    tint: '#7c3aed',
    hint: 'What plays, and music folders',
  },
  {
    id: 'sources',
    label: 'Music sources',
    icon: 'disc',
    tint: '#db2777',
    hint: 'Where Discover finds music',
  },
  {
    id: 'playlists',
    label: 'Playlists',
    icon: 'music',
    tint: '#8b5cf6',
    hint: 'Rename, delete, create',
  },
  {
    id: 'memories',
    label: 'Memories and privacy',
    icon: 'pin',
    tint: '#10b981',
    hint: 'Places and what leaves your device',
  },
  {
    id: 'data',
    label: 'Your data',
    icon: 'folder',
    tint: '#3b82f6',
    hint: 'Backup, storage and deleting',
  },
  {
    id: 'keys',
    label: 'Keyboard shortcuts',
    icon: 'keyboard',
    tint: '#64748b',
    hint: 'Control Songsky from the keyboard',
  },
  {
    id: 'about',
    label: 'About Songsky',
    icon: 'info',
    tint: '#0ea5e9',
    hint: `Version ${__APP_VERSION__}`,
  },
];

const wide = matchMedia('(min-width: 1100px)');
let isWide = $state(wide.matches);
$effect(() => {
  const update = () => {
    isWide = wide.matches;
  };
  wide.addEventListener('change', update);
  return () => wide.removeEventListener('change', update);
});

/** Desktop always shows a section (the first by default); phones show the list until one is picked. */
const current = $derived(
  SECTIONS.find((s) => s.id === view.settingsSection) ?? (isWide ? SECTIONS[0] : undefined),
);

/** Whether Songsky's server has a Jamendo key (see .env.example). */
let hasJamendo = $state(false);
$effect(() => {
  void jamendoAvailable().then((ok) => {
    hasJamendo = ok;
  });
});

/** My music and Online music as two switches; at least one stays on. */
function setPlays(local: boolean, online: boolean) {
  if (!local && !online) return;
  prefs.setMode(local && online ? 'both' : local ? 'local' : 'online');
}

let busyFolder = $state<string | null>(null);

async function rescan(folder: string) {
  busyFolder = folder;
  try {
    await library.rescanFolder(folder);
  } finally {
    busyFolder = null;
  }
}

async function removeFolder(folder: string) {
  const ok = await ask({
    title: `Remove “${folder}”?`,
    message:
      'Its songs are removed from your library and Songsky stops reading the folder. The files on your device are not touched.',
    action: 'Remove folder',
  });
  if (!ok) return;
  await library.removeFolder(folder);
  toast.show(`Removed ${folder}.`);
}

const presets = Object.entries(EQ_PRESETS) as [EqPresetId, (typeof EQ_PRESETS)[EqPresetId]][];
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const songCount = (trackIds: string[]) => trackIds.filter((id) => library.byId.has(id)).length;

const skyNow = $derived(
  sky.source === 'location'
    ? `Following the weather where you are${sky.place ? `, ${sky.place.name}` : ''}.`
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

function backUp() {
  downloadBackup();
  toast.show('Backup saved to your downloads.');
}

let restoreInput = $state<HTMLInputElement>();

async function restore(event: Event & { currentTarget: HTMLInputElement }) {
  const file = event.currentTarget.files?.[0];
  event.currentTarget.value = '';
  if (!file) return;
  let backup: Backup;
  try {
    backup = parseBackup(await file.text());
  } catch (error) {
    toast.show(error instanceof Error ? error.message : 'That file isn’t a Songsky backup.');
    return;
  }
  const plan = previewRestore(backup);
  const parts = [
    plural(plan.songs.length, 'online song'),
    plural(plan.playlists.length, 'playlist'),
    plural(plan.plays.length, 'play'),
  ];
  const when = backup.exportedAt ? ` from ${backup.exportedAt.slice(0, 10)}` : '';
  const ok = await ask({
    title: `Restore the backup${when}?`,
    message: `This adds ${parts.join(', ')} and uses the backup’s settings. Nothing on this device is deleted. Songsky reloads afterwards.`,
    action: 'Restore',
    tone: 'calm',
  });
  if (ok) await restoreBackup(backup);
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

const APP_URL = 'https://songsky.subashsdhami.com.np';
const REPO_URL = 'https://github.com/mesubash/songsky';

/** Browsers without an install prompt (iPhone, Safari, Firefox) get written steps instead. */
const steps = installSteps();
let showSteps = $state(false);

/**
 * The repository's star count, read from GitHub's public API when About opens. GitHub
 * only shares it for public repositories; until then the Star button shows no count.
 */
let repo = $state<{ stars: number } | null>(null);
$effect(() => {
  if (current?.id !== 'about' || repo) return;
  fetch('https://api.github.com/repos/mesubash/songsky')
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { stargazers_count?: number; private?: boolean } | null) => {
      if (data && !data.private && typeof data.stargazers_count === 'number') {
        repo = { stars: data.stargazers_count };
      }
    })
    .catch(() => {});
});

async function shareApp() {
  const data = {
    title: 'Songsky',
    text: 'A free music player that follows your sky.',
    url: APP_URL,
  };
  try {
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(APP_URL);
      toast.show('Link to Songsky copied.');
    }
  } catch {
    // Closed the share sheet.
  }
}

const CREDITS: { name: string; what: string; url: string }[] = [
  { name: 'Audius', what: 'Free music in Discover', url: 'https://audius.co' },
  { name: 'Jamendo', what: 'Creative Commons music', url: 'https://www.jamendo.com' },
  { name: 'Radio Browser', what: 'Live radio stations', url: 'https://www.radio-browser.info' },
  { name: 'Open-Meteo', what: 'Weather', url: 'https://open-meteo.com' },
  { name: 'BigDataCloud', what: 'Town names', url: 'https://www.bigdatacloud.com' },
  {
    name: 'OpenStreetMap and Leaflet',
    what: 'The memory map',
    url: 'https://www.openstreetmap.org',
  },
  { name: 'Trystero', what: 'Listen together', url: 'https://github.com/dmotz/trystero' },
  {
    name: 'music-metadata',
    what: 'Reading song tags',
    url: 'https://github.com/Borewit/music-metadata',
  },
  {
    name: 'web-audio-beat-detector',
    what: 'Tempo detection',
    url: 'https://github.com/chrisguttandin/web-audio-beat-detector',
  },
  { name: 'Svelte', what: 'The interface', url: 'https://svelte.dev' },
];
</script>

<div class="settings" class:open={!!current}>
  <h2 class="desktop-title">Settings</h2>

  <nav class="list" aria-label="Settings sections">
    <ul>
      {#each SECTIONS as section (section.id)}
        <li>
          <a
            href="#settings/{section.id}"
            aria-current={current?.id === section.id ? 'page' : undefined}
          >
            <span class="tile" style:--tint={section.tint}
              ><Icon name={section.icon} size={18} /></span
            >
            <span class="entry">
              <span class="entry-name">{section.label}</span>
              <span class="entry-hint">{section.hint}</span>
            </span>
            <span class="chevron" aria-hidden="true"><Icon name="chevron-down" size={16} /></span>
          </a>
        </li>
      {/each}
    </ul>
  </nav>

  {#if current}
    <section class="pane" aria-labelledby="pane-title">
      <a class="back" href="#settings"><Icon name="chevron-down" size={18} />Settings</a>
      <header class="pane-head">
        <span class="tile big" style:--tint={current.tint}
          ><Icon name={current.icon} size={22} /></span
        >
        <h3 id="pane-title">{current.label}</h3>
      </header>

      {#if current.id === 'sky'}
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
          <div class="row">
            <div class="text">
              <p class="name">Weather on screen</p>
              <p class="desc">Faint rain or snow falls across the page when your weather has it.</p>
            </div>
            <Switch
              bare
              label="Weather on screen"
              checked={prefs.weatherEffects}
              onchange={(on) => prefs.setWeatherEffects(on)}
            />
          </div>
        </div>
      {:else if current.id === 'sound'}
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
      {:else if current.id === 'music'}
        <div class="rows">
          <div class="row">
            <div class="text">
              <p class="name">My music</p>
              <p class="desc">
                Songs on this device: folders and files you add. Turn off to use only online music.
              </p>
            </div>
            <Switch
              bare
              label="My music"
              checked={prefs.localMusic}
              disabled={prefs.localMusic && !prefs.onlineMusic}
              onchange={(on) => setPlays(on, prefs.onlineMusic)}
            />
          </div>
          <div class="row">
            <div class="text">
              <p class="name">Online music</p>
              <p class="desc">
                Free music from the internet: Discover, radio and songs you saved. Turn off and no
                music is fetched online.
              </p>
            </div>
            <Switch
              bare
              label="Online music"
              checked={prefs.onlineMusic}
              disabled={prefs.onlineMusic && !prefs.localMusic}
              onchange={(on) => setPlays(prefs.localMusic, on)}
            />
          </div>
        </div>
        {#if prefs.mode !== 'both'}
          <p class="note">
            At least one has to stay on, so the other can’t be turned off right now.
          </p>
        {/if}

        {#if prefs.localMusic}
          <div class="section-row">
            <h4>Music folders</h4>
            {#if library.canChooseFolder}
              <Button icon="folder" onclick={() => library.addFolder()}>Add a folder</Button>
            {/if}
          </div>
          {#if library.folderNames.length}
            <ul class="rows">
              {#each library.folderNames as folder (folder)}
                {@const connected = library.folders.includes(folder)}
                <li class="row">
                  <div class="text">
                    <p class="name">{folder}</p>
                    <p class="desc">
                      {connected
                        ? 'Connected: Songsky reads songs straight from this folder.'
                        : 'Copied into Songsky. Add the folder again to pick up new songs.'}
                    </p>
                  </div>
                  <div class="control">
                    {#if connected}
                      <Button
                        variant="quiet"
                        disabled={busyFolder === folder}
                        onclick={() => rescan(folder)}
                        >{busyFolder === folder ? 'Rescanning…' : 'Rescan'}</Button
                      >
                    {/if}
                    <Button variant="quiet" onclick={() => removeFolder(folder)}>Remove</Button>
                  </div>
                </li>
              {/each}
            </ul>
          {:else}
            <div class="empty">
              <p class="name">No music folders yet</p>
              <p class="desc">
                Add the folder where you keep your music and Songsky reads the songs in it.
              </p>
            </div>
          {/if}

          {#if library.canPickFolder}
            <div class="rows">
              <div class="row">
                <div class="text">
                  <p class="name">Check folders when Songsky opens</p>
                  <p class="desc">
                    New songs in your connected folders are added automatically, and removed files
                    leave the library.
                  </p>
                </div>
                <Switch
                  bare
                  label="Check folders when Songsky opens"
                  checked={prefs.autoRescan}
                  onchange={(on) => prefs.setAutoRescan(on)}
                />
              </div>
            </div>
          {:else if library.canChooseFolder}
            <p class="note">
              This browser can pick a folder once and copies its songs, but it can’t keep the folder
              connected to check for new songs automatically. Chrome and Edge can. In Brave, turn on
              “File System Access API” at brave://flags, then restart Brave.
            </p>
          {/if}
        {/if}
      {:else if current.id === 'sources'}
        {#if !prefs.onlineMusic}
          <p class="note">
            Online music is off. Choose “Both” or “Online music” in
            <a class="inline-link" href="#settings/music">Your music</a> to use these sources.
          </p>
        {/if}
        <p class="note">
          Turn off a source to hide it from Discover. Songs you saved from it stay in your library.
        </p>
        <div class="rows">
          <div class="row">
            <div class="text">
              <p class="name">Audius</p>
              <p class="desc">
                Free songs from independent artists: picks for your sky, trending, genres, playlists
                and search.
              </p>
            </div>
            <Switch
              bare
              label="Audius"
              checked={prefs.sources.audius}
              onchange={(on) => prefs.setSource('audius', on)}
            />
          </div>
          {#if hasJamendo}
            <div class="row">
              <div class="text">
                <p class="name">Jamendo</p>
                <p class="desc">
                  Creative Commons music shared by its artists, mixed into For you, Genres and
                  search. Plays without the equalizer and crossfade.
                </p>
              </div>
              <Switch
                bare
                label="Jamendo"
                checked={prefs.sources.jamendo}
                onchange={(on) => prefs.setSource('jamendo', on)}
              />
            </div>
          {/if}
          <div class="row">
            <div class="text">
              <p class="name">Radio</p>
              <p class="desc">
                Live stations from the Radio Browser directory. Plays without the equalizer and
                crossfade.
              </p>
            </div>
            <Switch
              bare
              label="Radio"
              checked={prefs.sources.radio}
              onchange={(on) => prefs.setSource('radio', on)}
            />
          </div>
        </div>
      {:else if current.id === 'playlists'}
        <div class="pane-actions">
          <Button variant="primary" icon="plus" onclick={newPlaylist}>New playlist</Button>
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
          <div class="empty">
            <p class="name">No playlists yet</p>
            <p class="desc">Make one here, or use “Add to playlist” in any song’s ⋯ menu.</p>
          </div>
        {/if}
      {:else if current.id === 'memories'}
        <div class="rows">
          <div class="row">
            <div class="text">
              <p class="name">Remember where I listen</p>
              <p class="desc">
                Pins each song to the town where you played it, on a map in Memories. Places stay on
                this device.
              </p>
            </div>
            <Switch
              bare
              label="Remember where I listen"
              checked={memory.rememberPlaces}
              onchange={(on) => memory.setRememberPlaces(on)}
            />
          </div>
        </div>
        <h4>What leaves your device</h4>
        <div class="rows">
          <div class="row">
            <div class="text">
              <p class="name">Your music files</p>
              <p class="desc">Never. There’s no account and no Songsky server.</p>
            </div>
          </div>
          <div class="row">
            <div class="text">
              <p class="name">Your location, rounded to about 10 km</p>
              <p class="desc">
                Only if your sky uses it: sent to Open-Meteo for the weather and BigDataCloud for
                the town name.
              </p>
            </div>
          </div>
          <div class="row">
            <div class="text">
              <p class="name">What you search or play in Discover</p>
              <p class="desc">Sent to Audius or Jamendo, which host that music.</p>
            </div>
          </div>
          <div class="row">
            <div class="text">
              <p class="name">Listen together</p>
              <p class="desc">
                Songs go straight to your friends over an encrypted peer-to-peer link.
              </p>
            </div>
          </div>
        </div>
      {:else if current.id === 'data'}
        <div class="rows">
          <div class="row stack">
            <div class="text">
              <p class="name">On this device</p>
              <p class="desc">
                {plural(library.tracks.length, 'song')},
                {plural(playlists.list.length, 'playlist')},
                {plural(memory.plays.length, 'play')} in your history.
              </p>
            </div>
            {#if storage}
              <div class="meter">
                <div class="bar">
                  <span
                    style:width="{Math.max(1, (storage.used / (storage.quota || 1)) * 100)}%"
                  ></span>
                </div>
                <p class="desc">
                  {size(storage.used)} used of {size(storage.quota)} this browser allows
                </p>
              </div>
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
        <h4>Back up and restore</h4>
        <div class="rows">
          <div class="row">
            <div class="text">
              <p class="name">Back up</p>
              <p class="desc">
                Saves your saved online songs, playlists, history and settings to a file. Your own
                music files aren’t included; their places in playlists are.
              </p>
            </div>
            <Button icon="download" onclick={backUp}>Back up</Button>
          </div>
          <div class="row">
            <div class="text">
              <p class="name">Restore from a backup</p>
              <p class="desc">
                Adds what’s in a backup file to this device. Nothing here is deleted.
              </p>
            </div>
            <Button onclick={() => restoreInput?.click()}>Restore</Button>
            <input
              bind:this={restoreInput}
              class="visually-hidden"
              type="file"
              accept="application/json,.json"
              aria-label="Choose a Songsky backup file"
              onchange={restore}
            >
          </div>
        </div>

        <h4>Delete</h4>
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
      {:else if current.id === 'keys'}
        <dl class="rows keys">
          {#each SHORTCUTS as shortcut (shortcut.label)}
            <div class="row">
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
      {:else if current.id === 'about'}
        <div class="hero">
          <Logo size={88} />
          <p class="app-name">Songsky</p>
          <p class="desc">Music that follows your sky.</p>
          <p class="version">Version {__APP_VERSION__}, built {__BUILD_DATE__}</p>
          <div class="hero-actions">
            {#if pwa.installed}
              <span class="value">Installed as an app</span>
            {:else if pwa.canInstall}
              <Button variant="primary" icon="download" onclick={() => pwa.install()}
                >Install app</Button
              >
            {:else if steps}
              <Button
                variant="primary"
                icon="download"
                aria-expanded={showSteps}
                onclick={() => (showSteps = !showSteps)}
                >Install app</Button
              >
            {/if}
            <Button disabled={pwa.checking} onclick={() => pwa.checkForUpdates()}
              >{pwa.checking ? 'Checking…' : 'Check for updates'}</Button
            >
            <Button icon="share" onclick={shareApp}>Share Songsky</Button>
          </div>
          {#if showSteps && steps && !pwa.installed}
            <ol class="install-steps">
              {#each steps as step (step)}
                <li>{step}</li>
              {/each}
            </ol>
          {/if}
        </div>

        <div class="github">
          <Icon name="github" size={36} />
          <div class="gh-text">
            <a class="gh-name" href={REPO_URL} target="_blank" rel="noopener noreferrer"
              >mesubash/songsky</a
            >
            <p class="desc">Free and open source under the MIT license.</p>
          </div>
          <a class="gh-star" href={REPO_URL} target="_blank" rel="noopener noreferrer">
            <Icon name="star" size={16} />Star
            {#if repo}
              <span class="gh-count">{repo.stars.toLocaleString()}</span>
            {/if}
          </a>
        </div>

        <div class="rows">
          <a
            class="row link-row"
            href="{REPO_URL}/issues/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="text">
              <span class="name">Report a problem or suggest an idea</span>
              <span class="desc">Opens a new issue on GitHub.</span>
            </span>
            <Icon name="external" size={16} />
          </a>
          <a class="row link-row" href="#settings/memories">
            <span class="text">
              <span class="name">Privacy</span>
              <span class="desc">No account, no tracking. See what leaves your device.</span>
            </span>
            <span class="chevron"><Icon name="chevron-down" size={16} /></span>
          </a>
        </div>

        <h4>Made with</h4>
        <ul class="rows credits">
          {#each CREDITS as credit (credit.name)}
            <li class="row">
              <a class="name link" href={credit.url} target="_blank" rel="noopener noreferrer"
                >{credit.name}</a
              >
              <span class="desc">{credit.what}</span>
            </li>
          {/each}
        </ul>

        <p class="made">
          Made with <span class="heart" role="img" aria-label="love">❤️</span> by
          <a
            class="author"
            href="https://www.subashsdhami.com.np"
            target="_blank"
            rel="noopener noreferrer"
            >Subash Singh Dhami</a
          >
        </p>
      {/if}
    </section>
  {/if}
</div>

<style>
.settings {
  display: grid;
  gap: var(--space-6);
  padding-block: var(--space-8);
}

/* Phones: the list is its own screen; opening a section replaces it. */
.settings.open .list {
  display: none;
}

.list ul {
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
  list-style: none;
}

.list li + li {
  border-top: 1px solid var(--line);
}

.list a {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 60px;
  padding: var(--space-2) var(--space-4);
  color: var(--text);
  text-decoration: none;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.list a:hover {
  background: var(--surface-strong);
}

/* A coloured square behind each section's icon, as in system settings apps. */
.tile {
  display: grid;
  flex: none;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: var(--tint);
  color: #fff;
}

.tile.big {
  width: 44px;
  height: 44px;
  border-radius: 12px;
}

.entry {
  flex: 1;
  display: grid;
  min-width: 0;
}

.entry-name {
  font-weight: 600;
}

.entry-hint {
  overflow: hidden;
  color: var(--text-muted);
  font-size: var(--text-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron {
  display: grid;
  color: var(--text-muted);
  transform: rotate(-90deg);
}

.pane {
  display: grid;
  align-content: start;
  gap: var(--space-4);
  min-width: 0;
  animation: pane-in 200ms var(--ease-out);
}

.back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  width: fit-content;
  min-height: 44px;
  color: var(--text);
  font-weight: 600;
  text-decoration: none;
}

.back :global(svg) {
  transform: rotate(90deg);
}

.pane-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-bottom: var(--space-2);
}

h3 {
  font-size: var(--text-2xl);
  letter-spacing: -0.02em;
}

h4 {
  padding-top: var(--space-4);
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
}

.pane-actions {
  display: flex;
}

/* One panel per group; rows inside are split by thin lines. */
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

.text {
  flex: 1 1 18rem;
  display: grid;
  gap: 2px;
  min-width: 0;
}

/* Rows whose control is wide (button groups, meters) put it on its own line. */
.row.stack {
  flex-direction: column;
  align-items: stretch;
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
.or,
output,
.version {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.desc {
  max-width: 56ch;
}

.warn {
  color: var(--text);
  font-weight: 550;
}

.note {
  max-width: 60ch;
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
}

/* Joined buttons where one is chosen, like a physical switch. */
.segmented {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  width: fit-content;
  min-width: 0;
  margin: 0;
  padding: 4px;
  border: 0;
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

.section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-top: var(--space-4);
}

.section-row h4 {
  padding-top: 0;
}

.inline-link {
  color: var(--text);
}

.empty {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-8) var(--space-6);
  border: 1px dashed var(--line);
  border-radius: var(--radius-lg);
  text-align: center;
  justify-items: center;
}

.meter {
  display: grid;
  gap: var(--space-2);
}

.bar {
  height: 8px;
  overflow: hidden;
  border-radius: var(--radius-full);
  background: var(--surface-strong);
}

.bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
}

/* Deleting gets its own panel with a warm edge, so it reads as "careful". */
.danger {
  border-color: color-mix(in srgb, #c2410c 45%, var(--line));
}

.keys .row {
  min-height: 48px;
  padding-block: var(--space-2);
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

/* About: the app's icon, name and version, centred, as in an "About this app" window. */
.hero {
  display: grid;
  justify-items: center;
  gap: var(--space-1);
  padding: var(--space-8) var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
  text-align: center;
}

.hero :global(svg) {
  margin-bottom: var(--space-2);
}

.app-name {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--display-weight);
  letter-spacing: -0.03em;
}

.install-steps {
  display: grid;
  gap: var(--space-2);
  max-width: 26rem;
  margin: var(--space-4) auto 0;
  padding: var(--space-4) var(--space-4) var(--space-4) var(--space-8);
  border-radius: var(--radius-md);
  background: var(--surface-strong);
  text-align: start;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
  padding-top: var(--space-4);
}

.link-row {
  color: var(--text);
  text-decoration: none;
}

.link-row:hover {
  background: var(--surface-strong);
}

.credits .row {
  min-height: 48px;
  padding-block: var(--space-2);
}

.github {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.gh-text {
  flex: 1;
  display: grid;
  min-width: 0;
}

.gh-name {
  color: var(--text);
  font-weight: 650;
  text-decoration: none;
}

.gh-name:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.gh-star {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 40px;
  padding: 0 var(--space-2) 0 var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--surface-strong);
  color: var(--text);
  font-size: var(--text-sm);
  font-weight: 650;
  text-decoration: none;
}

.gh-star :global(svg) {
  color: #f5b942;
}

.gh-count {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--surface);
  font-variant-numeric: tabular-nums;
}

.author {
  color: var(--text);
  font-weight: 650;
  text-underline-offset: 3px;
}

.made {
  padding-top: var(--space-2);
  color: var(--text-muted);
  font-size: var(--text-sm);
  text-align: center;
}

/* Desktop: list on the left, the open section on the right. */
@media (min-width: 1100px) {
  .settings {
    grid-template-columns: 19rem minmax(0, 52rem);
    align-items: start;
    gap: var(--space-10, 40px);
    padding-top: var(--space-6);
  }

  .settings.open .list {
    position: sticky;
    top: 88px;
    display: block;
  }

  .list a[aria-current="page"] {
    background: var(--surface-strong);
  }

  .list a[aria-current="page"] .entry-name {
    color: var(--text);
  }

  .list .chevron,
  .back {
    display: none;
  }
}

@keyframes pane-in {
  from {
    transform: translateY(6px);
    opacity: 0;
  }
}
</style>
