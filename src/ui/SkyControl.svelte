<script lang="ts">
import { EQ_PRESETS } from '$lib/audio/eq';
import { sound } from '$lib/audio/sound.svelte';
import { player } from '$lib/player/player.svelte';
import { sky } from '$lib/sky/sky.svelte';
import { type Condition, type Place, searchPlaces, suggestedPreset } from '$lib/sky/weather';
import Button from './Button.svelte';
import Icon, { type IconName } from './Icon.svelte';
import { modal } from './modal';

let open = $state(false);
let query = $state('');
let results = $state<Place[] | null>(null);
let searching = $state(false);
let searchError = $state<string | null>(null);

const ICONS: Record<Condition, IconName> = {
  clear: 'sun',
  cloudy: 'cloud',
  fog: 'fog',
  rain: 'rain',
  snow: 'snow',
  storm: 'storm',
};

const icon = $derived.by((): IconName => {
  const condition = sky.weather?.condition;
  if (!condition) return sky.time === 'night' ? 'moon' : 'sun';
  if (condition === 'clear' && sky.time === 'night') return 'moon';
  return ICONS[condition];
});

const summary = $derived(
  sky.weather ? `${sky.weather.label}, ${sky.weather.temperature}°` : 'Match my sky',
);

const SKY_PHRASES: Record<Condition, string> = {
  clear: 'Clear skies',
  cloudy: 'Cloudy skies',
  fog: 'Foggy skies',
  rain: 'Rainy skies',
  snow: 'Snowy skies',
  storm: 'Stormy skies',
};

const suggestion = $derived.by(() => {
  const condition = sky.weather?.condition;
  if (!condition || !player.effectsAvailable) return null;
  const preset = suggestedPreset(condition, sky.time);
  if (!preset || sound.preset === preset) return null;
  return { preset, text: `${SKY_PHRASES[condition]} suit the ${EQ_PRESETS[preset].label} sound.` };
});

async function search(event: SubmitEvent) {
  event.preventDefault();
  const name = query.trim();
  if (name.length < 2) return;
  searching = true;
  searchError = null;
  try {
    results = await searchPlaces(name);
  } catch {
    searchError = 'Couldn’t search right now. Check your connection and try again.';
  } finally {
    searching = false;
  }
}

async function choose(place: Place) {
  results = null;
  query = '';
  await sky.useCity(place);
}

function closeOnBackdrop(event: MouseEvent) {
  if (event.target === event.currentTarget) open = false;
}
</script>

<button
  class="chip"
  type="button"
  aria-label={sky.weather ? `Sky: ${summary}` : 'Match my sky'}
  onclick={() => (open = true)}
>
  <Icon name={icon} size={18} />
  <span class="summary">{summary}</span>
</button>

<!-- biome-ignore lint/a11y/useKeyWithClickEvents: Escape already closes the native dialog; this only handles backdrop clicks. -->
<dialog
  class="panel"
  use:modal={open}
  aria-labelledby="sky-title"
  onclose={() => (open = false)}
  onclick={closeOnBackdrop}
>
  <div class="content">
    <header>
      <h2 id="sky-title">Your sky</h2>
      <Button variant="icon" icon="close" aria-label="Close" onclick={() => (open = false)} />
    </header>

    <p class="status" aria-live="polite">
      {#if sky.loading}
        Checking the sky…
      {:else if sky.weather && sky.place}
        <strong>{sky.weather.label}, {sky.weather.temperature}°</strong>
        {sky.source === 'location' ? 'where you are' : `in ${sky.place.name}`}.
      {:else}
        Songsky is following the time of day. Add your weather to tint the sky and suggest a sound.
      {/if}
    </p>

    {#if sky.error}
      <p class="error">{sky.error}</p>
    {/if}

    {#if suggestion}
      <div class="suggestion">
        <p>{suggestion.text}</p>
        <Button variant="primary" onclick={() => sound.usePreset(suggestion.preset)}>
          Use {EQ_PRESETS[suggestion.preset].label}
        </Button>
      </div>
    {/if}

    <Button icon="pin" onclick={() => sky.useLocation()} disabled={sky.loading}>
      Use my location
    </Button>

    <form class="search" onsubmit={search}>
      <label for="city">Or search for a city</label>
      <div class="field">
        <input
          id="city"
          type="search"
          bind:value={query}
          placeholder="Kathmandu"
          autocomplete="address-level2"
          enterkeyhint="search"
        >
        <Button
          variant="icon"
          icon="search"
          type="submit"
          aria-label="Search"
          disabled={searching}
        />
      </div>
    </form>

    {#if searchError}
      <p class="error">{searchError}</p>
    {/if}
    {#if results}
      {#if results.length === 0}
        <p class="hint">No places found. Check the spelling or try a nearby city.</p>
      {:else}
        <ul class="results">
          {#each results as place (`${place.latitude},${place.longitude}`)}
            <li><button type="button" onclick={() => choose(place)}>{place.name}</button></li>
          {/each}
        </ul>
      {/if}
    {/if}

    {#if sky.source !== 'time'}
      <button class="link" type="button" onclick={() => sky.useTimeOnly()}>
        Stop using weather
      </button>
    {/if}

    <p class="hint">
      Your location is rounded to about 10 km and sent only to Open-Meteo to get the forecast.
    </p>
  </div>
</dialog>

<style>
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: 0 var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: none;
  color: var(--text);
  font-size: var(--text-sm);
  font-weight: 550;
}

.chip:hover {
  background: var(--surface);
}

.panel {
  width: min(100% - 2rem, 26rem);
  max-height: calc(100dvh - 2rem);
  margin: auto; /* The global reset removes the dialog's default centering. */
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--sky-top) 92%, var(--text));
  color: var(--text);
}

.panel::backdrop {
  background: rgb(0 0 0 / 0.4);
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

.status {
  color: var(--text-muted);
}

.status strong {
  color: var(--text);
}

.suggestion {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.suggestion :global(.button) {
  justify-self: start;
}

.search {
  display: grid;
  gap: var(--space-2);
  padding-top: var(--space-2);
}

label {
  font-weight: 600;
}

.field {
  display: flex;
  gap: var(--space-2);
}

input {
  flex: 1;
  min-width: 0;
  min-height: 44px;
  padding: 0 var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--surface);
}

input::placeholder {
  color: var(--text-muted);
}

.results {
  display: grid;
  gap: var(--space-1);
  padding: 0;
  list-style: none;
}

.results button {
  width: 100%;
  min-height: 44px;
  padding: var(--space-2) var(--space-3);
  border: 0;
  border-radius: var(--radius-md);
  background: none;
  text-align: start;
}

.results button:hover {
  background: var(--surface);
}

.link {
  justify-self: start;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--text-muted);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.hint {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.error {
  color: #ffb4a3;
  font-size: var(--text-sm);
}

:global(:root[data-sky="day"]) .error {
  color: #9b2c14;
}

@media (max-width: 720px) {
  .summary {
    display: none;
  }

  .chip {
    width: 44px;
    padding: 0;
    justify-content: center;
  }
}
</style>
