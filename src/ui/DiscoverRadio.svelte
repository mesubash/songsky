<script lang="ts">
import { radio } from '$lib/radio/radio.svelte';
import { findStations, type Station } from '$lib/radio/stations';
import Icon from './Icon.svelte';

/** Live internet radio from the free Radio Browser directory: by style, or by name. */

// Radio Browser tags. "Popular" lists the most-played stations overall.
const STYLES: { tag: string; label: string }[] = [
  { tag: '', label: 'Popular' },
  { tag: 'pop', label: 'Pop' },
  { tag: 'rock', label: 'Rock' },
  { tag: 'hiphop', label: 'Hip-hop' },
  { tag: 'dance', label: 'Dance' },
  { tag: 'electronic', label: 'Electronic' },
  { tag: 'chillout', label: 'Chill' },
  { tag: 'lofi', label: 'Lo-fi' },
  { tag: 'jazz', label: 'Jazz' },
  { tag: 'classical', label: 'Classical' },
  { tag: 'nepali', label: 'Nepali' },
  { tag: 'bollywood', label: 'Bollywood' },
  { tag: 'kpop', label: 'K-pop' },
  { tag: 'latin', label: 'Latin' },
  { tag: '80s', label: '80s' },
  { tag: '90s', label: '90s' },
  { tag: 'country', label: 'Country' },
  { tag: 'reggae', label: 'Reggae' },
  { tag: 'ambient', label: 'Ambient' },
];

let style = $state('');
let query = $state('');
let searched = $state('');
let stations = $state<Station[]>([]);
let status = $state<'idle' | 'loading' | 'error'>('loading');

const cache = new Map<string, Station[]>();

$effect(() => {
  const key = searched ? `name:${searched}` : `tag:${style}`;
  const cached = cache.get(key);
  if (cached) {
    stations = cached;
    status = 'idle';
    return;
  }
  let alive = true;
  status = 'loading';
  findStations(searched ? { name: searched } : { tag: style || undefined })
    .then((found) => {
      if (!alive) return;
      cache.set(key, found);
      stations = found;
      status = 'idle';
    })
    .catch(() => {
      if (alive) status = 'error';
    });
  return () => {
    alive = false;
  };
});

function pickStyle(tag: string) {
  style = tag;
  searched = '';
  query = '';
}

function submit(event: SubmitEvent) {
  event.preventDefault();
  searched = query.trim();
}

function toggle(station: Station) {
  if (radio.station?.id === station.id) radio.toggle();
  else void radio.play(station);
}
</script>

<div class="radio">
  <div class="tools">
    <fieldset class="chips">
      <legend class="visually-hidden">Radio styles</legend>
      {#each STYLES as option (option.tag)}
        <button
          type="button"
          class="chip"
          aria-pressed={!searched && style === option.tag}
          onclick={() => pickStyle(option.tag)}
        >
          {option.label}
        </button>
      {/each}
    </fieldset>
    <search>
      <form class="find" onsubmit={submit}>
        <label class="visually-hidden" for="radio-search">Find a station by name</label>
        <Icon name="search" size={16} />
        <input
          id="radio-search"
          type="search"
          placeholder="Find a station by name"
          autocomplete="off"
          bind:value={query}
          oninput={() => {
            if (!query.trim()) searched = '';
          }}
        >
      </form>
    </search>
  </div>

  {#if radio.error}
    <p class="note warn" role="status">{radio.error}</p>
  {/if}

  {#if status === 'loading' && !stations.length}
    <ul class="stations" aria-busy="true">
      {#each Array.from({ length: 6 }, (_, i) => i) as i (i)}
        <li class="placeholder" aria-hidden="true"></li>
      {/each}
    </ul>
  {:else if status === 'error'}
    <p class="note">Couldn’t reach the radio directory. Check your connection and try again.</p>
  {:else if !stations.length}
    <p class="note">No stations found. Try another name or style.</p>
  {:else}
    <ul class="stations">
      {#each stations as station (station.id)}
        {@const isCurrent = radio.station?.id === station.id}
        <li>
          <button
            class="station"
            class:current={isCurrent}
            type="button"
            aria-label="{isCurrent && radio.playing ? 'Pause' : 'Play'} {station.name}"
            onclick={() => toggle(station)}
          >
            <span class="logo">
              {#if station.logo}
                <img
                  src={station.logo}
                  alt=""
                  loading="lazy"
                  referrerpolicy="no-referrer"
                  onerror={(e) => e.currentTarget.remove()}
                >
              {/if}
              <Icon name="disc" size={20} />
            </span>
            <span class="text">
              <span class="name">{station.name}</span>
              <span class="meta">
                {[station.country, ...station.tags].filter(Boolean).join(', ')}
              </span>
            </span>
            <span class="state" aria-hidden="true">
              {#if isCurrent && radio.loading}
                <span class="spinner"></span>
              {:else if isCurrent && radio.playing}
                <span class="bars"><i></i><i></i><i></i></span>
              {:else}
                <Icon name="play" size={18} />
              {/if}
            </span>
          </button>
        </li>
      {/each}
    </ul>
    <p class="credit">
      Stations from
      <a href="https://www.radio-browser.info" target="_blank" rel="noopener noreferrer"
        >Radio Browser</a
      >, a free community directory. Live radio plays without the equalizer and crossfade.
    </p>
  {/if}
</div>

<style>
.radio {
  display: grid;
  gap: var(--space-6);
  padding: var(--space-2) 0 var(--space-8);
}

.tools {
  display: grid;
  gap: var(--space-4);
}

.chips {
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
  padding: 0 var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text);
  font-size: var(--text-sm);
  font-weight: 550;
}

.chip:hover {
  background: var(--surface-strong);
}

.chip[aria-pressed="true"] {
  border-color: transparent;
  background: var(--accent);
  color: var(--on-accent);
}

.find {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  max-width: 26rem;
  min-height: 44px;
  padding: 0 var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text-muted);
}

.find:focus-within {
  border-color: var(--accent);
}

.find input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: none;
  color: var(--text);
  font: inherit;
}

.stations {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.station {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: 72px;
  padding: var(--space-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
  text-align: start;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.station:hover {
  background: var(--surface-strong);
}

.station.current {
  border-color: var(--accent);
  background: var(--surface-strong);
}

/* The logo sits on top of a disc icon, so a missing or broken logo still shows something. */
.logo {
  position: relative;
  display: grid;
  flex: none;
  place-items: center;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--surface-strong);
  color: var(--text-muted);
}

.logo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #fff;
}

.text {
  flex: 1;
  display: grid;
  min-width: 0;
}

.name,
.meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.name {
  font-weight: 600;
}

.meta,
.note,
.credit {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.warn {
  color: var(--text);
  font-weight: 550;
}

.credit a {
  color: var(--text);
}

.state {
  display: grid;
  flex: none;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
}

.bars {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 14px;
}

.bars i {
  width: 3px;
  height: 100%;
  border-radius: 1px;
  background: currentColor;
  transform-origin: bottom;
  animation: bounce 900ms ease-in-out infinite alternate;
}

.bars i:nth-child(2) {
  animation-delay: -300ms;
}

.bars i:nth-child(3) {
  animation-delay: -600ms;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 800ms linear infinite;
}

.placeholder {
  height: 72px;
  border-radius: var(--radius-lg);
  background: var(--surface-strong);
  animation: pulse 1.4s ease-in-out infinite alternate;
}

@keyframes bounce {
  from {
    transform: scaleY(0.25);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  from {
    opacity: 0.45;
  }
}
</style>
