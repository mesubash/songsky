<script lang="ts">
import { library } from '$lib/library/library.svelte';
import { memory } from '$lib/memory/memory.svelte';
import { collapseRepeats, groupByDay, timeAgo } from '$lib/memory/places';
import { player } from '$lib/player/player.svelte';
import { sky } from '$lib/sky/sky.svelte';
import Button from './Button.svelte';
import Cover from './Cover.svelte';
import Icon from './Icon.svelte';
import MemoryMap from './MemoryMap.svelte';
import Switch from './Switch.svelte';

const RECENT = 40;

// Only plays we can still show and replay (older entries of unsaved streams are skipped).
// Repeat plays of the same song in a row fold into one row with a count.
const days = $derived(
  groupByDay(
    collapseRepeats(memory.plays.filter((play) => library.byId.has(play.trackId))).slice(0, RECENT),
  ),
);
const placeCount = $derived(memory.places.length);
const ids = $derived(library.tracks.map((t) => t.id));

/** Which friendly card to show above the map, if any. */
const tip = $derived(!memory.rememberPlaces ? 'off' : !sky.place ? 'no-place' : null);

function startTrack(trackId: string) {
  const index = ids.indexOf(trackId);
  void (index >= 0 ? player.playList(ids, index) : player.playList([trackId]));
}

const timeOfDay = (t: number) =>
  new Date(t).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });
</script>

<section class="memories" aria-labelledby="memories-title">
  <div class="desktop-title head">
    <h2 id="memories-title" class="title">Memories</h2>
    <p class="meta">
      {#if memory.plays.length === 0}
        Songs you play show up here.
      {:else}
        {memory.plays.length} {memory.plays.length === 1 ? 'play' : 'plays'}{placeCount
          ? ` in ${placeCount} ${placeCount === 1 ? 'place' : 'places'}`
          : ''}
      {/if}
    </p>
  </div>

  {#if tip}
    <div class="tip">
      <span class="tip-icon" aria-hidden="true"><Icon name="pin" size={22} /></span>
      <div class="tip-text">
        {#if tip === 'off'}
          <h3>See where your songs happened</h3>
          <p>
            Songsky can pin each song to the place you played it, so your listening becomes a map.
            Places stay on this device.
          </p>
        {:else if tip === 'no-place'}
          <h3>Where are you listening?</h3>
          <p>Share your location or pick a city so Songsky knows where to pin your songs.</p>
        {/if}
      </div>
      <div class="tip-actions">
        {#if tip === 'off'}
          <Button variant="primary" onclick={() => memory.setRememberPlaces(true)}>Turn on</Button>
        {:else if tip === 'no-place'}
          <Button variant="primary" icon="pin" onclick={() => sky.useLocation()}
            >Use my location</Button
          >
          <Button onclick={() => (sky.panelOpen = true)}>Choose a city</Button>
        {/if}
      </div>
    </div>
  {/if}

  {#if placeCount > 0}
    <div class="map-block">
      <MemoryMap places={memory.places} />
      <div class="map-foot">
        <span class="map-note">Map tiles from OpenStreetMap. Your places stay on this device.</span>
        <Switch
          checked={memory.rememberPlaces}
          label="Remember where I listen"
          onchange={(on) => memory.setRememberPlaces(on)}
        />
      </div>
    </div>
  {/if}

  {#if days.length}
    <section class="history" aria-labelledby="history-title">
      <h3 id="history-title">Recently played</h3>
      {#each days as day (day.label)}
        <div class="day">
          <h4>{day.label}</h4>
          <ol>
            {#each day.plays as entry (entry.playedAt)}
              {@const track = library.byId.get(entry.trackId)}
              <li>
                <button
                  class="row"
                  type="button"
                  disabled={!track}
                  onclick={() => startTrack(entry.trackId)}
                >
                  <Cover
                    coverId={track?.coverId ?? null}
                    artworkUrl={track?.artworkUrl}
                    size={44}
                  />
                  <span class="main">
                    <span class="name">{track?.title ?? 'Song no longer available'}</span>
                    <span class="sub"
                      >{[
                        track?.artist,
                        entry.place?.name,
                        entry.times > 1 ? `played ${entry.times} times` : '',
                      ]
                        .filter(Boolean)
                        .join(', ')}</span
                    >
                  </span>
                  <span class="when">
                    {day.label === 'Today' ? timeAgo(entry.playedAt) : timeOfDay(entry.playedAt)}
                  </span>
                </button>
              </li>
            {/each}
          </ol>
        </div>
      {/each}
    </section>
  {:else}
    <p class="empty-note">Nothing played yet. Your listening history will show up here.</p>
  {/if}
</section>

<style>
.memories {
  display: grid;
  gap: var(--space-8);
  padding-bottom: var(--space-8);
}

.head {
  display: grid;
  gap: var(--space-1);
  padding-top: var(--space-8);
}

.title {
  font-size: var(--text-2xl);
  letter-spacing: -0.02em;
}

.meta,
.empty-note {
  color: var(--text-muted);
}

/* A friendly card instead of a settings note: what it is, why, and one clear action. */
.tip {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.tip-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
}

.tip-text {
  display: grid;
  gap: var(--space-1);
}

.tip h3 {
  font-size: var(--text-lg);
}

.tip p {
  max-width: 46ch;
  color: var(--text-muted);
}

.tip-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  grid-column: 2;
}

.tip-actions:empty {
  display: none;
}

.map-block {
  display: grid;
  gap: var(--space-3);
}

.map-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.map-note {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.history {
  display: grid;
  gap: var(--space-6);
}

.history > h3 {
  font-size: var(--text-xl);
  letter-spacing: -0.02em;
}

.day {
  display: grid;
  gap: var(--space-2);
}

h4 {
  padding-inline: var(--space-3);
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
}

ol {
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
  min-height: 60px;
  padding: var(--space-2) var(--space-3);
  border: 0;
  border-radius: var(--radius-md);
  background: none;
  text-align: start;
}

.row:disabled {
  opacity: 0.5;
  cursor: default;
}

.row:hover:not(:disabled) {
  background: var(--surface);
}

.main {
  flex: 1;
  display: grid;
  min-width: 0;
}

.name,
.sub {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.name {
  font-weight: 550;
}

.sub,
.when {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.when {
  flex: none;
  font-variant-numeric: tabular-nums;
}

/* Wide screens: the card puts its buttons on the right. */
@media (min-width: 720px) {
  .tip {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .tip-actions {
    grid-column: auto;
  }
}

/* Desktop: the title is in the top bar. */
@media (min-width: 1100px) {
  .memories {
    padding-top: var(--space-4);
  }
}
</style>
