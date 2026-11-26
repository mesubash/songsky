<script lang="ts">
import { type TrendingTime, trending } from '$lib/discover/audius';
import { discover } from '$lib/discover/discover.svelte';
import { type JamendoOrder, jamendoTracks } from '$lib/discover/jamendo';
import { interleave } from '$lib/discover/sources';
import { library } from '$lib/library/library.svelte';
import type { Track } from '$lib/library/types';
import { player } from '$lib/player/player.svelte';
import Button from './Button.svelte';
import TrackList from './TrackList.svelte';
import TrackSkeleton from './TrackSkeleton.svelte';

/** Audius genres as tiles; picking one shows its top songs for a chosen time span. */

// Audius genre names (sent as-is) with a colour each for the tiles.
const GENRES: { name: string; label?: string; tint: string }[] = [
  { name: 'Electronic', tint: '#5d5fe2' },
  { name: 'Hip-Hop/Rap', label: 'Hip-hop', tint: '#b4520e' },
  { name: 'Pop', tint: '#c23a7d' },
  { name: 'R&B/Soul', label: 'R&B and soul', tint: '#934ada' },
  { name: 'Lo-Fi', label: 'Lo-fi', tint: '#0c7c70' },
  { name: 'House', tint: '#0977a9' },
  { name: 'Rock', tint: '#d23b3b' },
  { name: 'Alternative', tint: '#64748b' },
  { name: 'Ambient', tint: '#15853e' },
  { name: 'Jazz', tint: '#a75b02' },
  { name: 'Acoustic', tint: '#a16207' },
  { name: 'Latin', tint: '#e11d48' },
  { name: 'Techno', tint: '#4f46e5' },
  { name: 'Drum & Bass', label: 'Drum and bass', tint: '#067f9c' },
  { name: 'Dubstep', tint: '#7c3aed' },
  { name: 'Trap', tint: '#c04809' },
  { name: 'Classical', tint: '#78716c' },
  { name: 'Folk', tint: '#4d7d09' },
  { name: 'Funk', tint: '#c026d3' },
  { name: 'Reggae', tint: '#10863c' },
  { name: 'Metal', tint: '#334155' },
  { name: 'Country', tint: '#b45309' },
  { name: 'Soundtrack', tint: '#2563eb' },
  { name: 'World', tint: '#0b8277' },
];

/** Phones show the short label so all four fit on one line. */
const TIMES: { id: TrendingTime; label: string; short: string }[] = [
  { id: 'week', label: 'This week', short: 'Week' },
  { id: 'month', label: 'This month', short: 'Month' },
  { id: 'year', label: 'This year', short: 'Year' },
  { id: 'allTime', label: 'All time', short: 'All time' },
];

let genre = $state<(typeof GENRES)[number] | null>(null);
let time = $state<TrendingTime>('week');
let tracks = $state<Track[]>([]);
let status = $state<'idle' | 'loading' | 'error'>('idle');

// Kept for this visit, so going back and forth between genres is instant.
const cache = new Map<string, Track[]>();

$effect(() => {
  if (!genre) return;
  const key = `${genre.name}|${time}|${discover.useAudius}|${discover.useJamendo}`;
  const cached = cache.get(key);
  if (cached) {
    tracks = cached;
    status = 'idle';
    return;
  }
  let alive = true;
  status = 'loading';
  const g = genre;
  // Both sources, mixed: Audius trending in the genre and Jamendo's most played with its tag.
  Promise.allSettled([
    discover.useAudius ? trending(30, time, g.name) : Promise.resolve([]),
    discover.useJamendo
      ? jamendoTracks({ tags: jamendoTag(g.name), order: JAMENDO_ORDER[time] }, 20)
      : Promise.resolve([]),
  ]).then((results) => {
    if (!alive) return;
    if (results.every((r) => r.status === 'rejected')) {
      status = 'error';
      return;
    }
    const found = interleave(...results.map((r) => (r.status === 'fulfilled' ? r.value : [])));
    library.rememberStreams(found);
    cache.set(key, found);
    tracks = found;
    status = 'idle';
  });
  return () => {
    alive = false;
  };
});

const label = (g: (typeof GENRES)[number]) => g.label ?? g.name;

const JAMENDO_ORDER: Record<TrendingTime, JamendoOrder> = {
  week: 'popularity_week',
  month: 'popularity_month',
  year: 'popularity_total',
  allTime: 'popularity_total',
};

/** Jamendo's tag for an Audius genre name ("Hip-Hop/Rap" is "hiphop" there). */
const JAMENDO_TAGS: Record<string, string> = {
  'Hip-Hop/Rap': 'hiphop',
  'R&B/Soul': 'rnb',
  'Drum & Bass': 'drumnbass',
};
const jamendoTag = (name: string) =>
  JAMENDO_TAGS[name] ?? name.toLowerCase().replace(/[^a-z0-9]/g, '');
</script>

{#if genre}
  <section class="block" aria-labelledby="genre-title">
    <button class="back" type="button" onclick={() => (genre = null)}>‹ All genres</button>
    <div class="genre-head" style:--tint={genre.tint}>
      <div>
        <h3 id="genre-title">{label(genre)}</h3>
        <p class="meta">Top songs from independent artists.</p>
      </div>
      <div class="genre-actions">
        <fieldset class="times">
          <legend class="visually-hidden">Time span</legend>
          {#each TIMES as option (option.id)}
            <button
              type="button"
              aria-pressed={time === option.id}
              onclick={() => (time = option.id)}
            >
              <span class="long">{option.label}</span><span class="short">{option.short}</span>
            </button>
          {/each}
        </fieldset>
        <Button
          variant="primary"
          icon="play"
          disabled={!tracks.length}
          onclick={() => player.playInOrder(tracks.map((t) => t.id))}
          >Play all</Button
        >
      </div>
    </div>
    {#if status === 'loading' && !tracks.length}
      <TrackSkeleton label="Loading {label(genre)} songs" />
    {:else if status === 'error'}
      <p class="note">Couldn’t reach the music library. Check your connection and try again.</p>
    {:else if tracks.length}
      <TrackList {tracks} />
    {:else}
      <p class="note">No songs here yet. Try a longer time span.</p>
    {/if}
  </section>
{:else}
  <ul class="tiles">
    {#each GENRES as g (g.name)}
      <li>
        <button
          type="button"
          class="tile"
          style:--tint={g.tint}
          onclick={() => {
            tracks = [];
            genre = g;
          }}
        >
          {label(g)}
        </button>
      </li>
    {/each}
  </ul>
{/if}

<style>
/* Big colourful tiles, like a record shop's genre dividers. */
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: var(--space-3);
  margin: 0;
  padding: var(--space-2) 0 var(--space-8);
  list-style: none;
}

.tile {
  position: relative;
  display: flex;
  align-items: flex-end;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  padding: var(--space-4);
  border: 0;
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 100% 0, rgb(255 255 255 / 0.25), transparent 55%), var(--tint);
  color: #fff;
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--display-weight);
  letter-spacing: -0.02em;
  text-align: start;
  transition: transform 180ms var(--ease-out);
}

.tile:hover {
  transform: translateY(-3px);
}

.block {
  display: grid;
  gap: var(--space-4);
  padding-bottom: var(--space-8);
}

.back {
  width: fit-content;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--text);
  font-weight: 600;
}

.genre-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 100% 0, rgb(255 255 255 / 0.25), transparent 60%), var(--tint);
  color: #fff;
}

.genre-head h3 {
  font-size: var(--text-2xl);
  letter-spacing: -0.02em;
}

.genre-head .meta {
  color: rgb(255 255 255 / 0.85);
}

.genre-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

/* Time spans as joined buttons on the banner: frosted white, the chosen one solid. */
.times {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  min-width: 0;
  margin: 0;
  padding: 3px;
  border: 0;
  border-radius: var(--radius-full);
  background: rgb(255 255 255 / 0.18);
}

.times button {
  min-height: 38px;
  padding: 0 var(--space-3);
  border: 0;
  border-radius: var(--radius-full);
  background: none;
  color: #fff;
  font-size: var(--text-sm);
  font-weight: 600;
}

.times button:hover {
  background: rgb(255 255 255 / 0.15);
}

.times button[aria-pressed="true"] {
  background: #fff;
  color: #111827;
}

.note {
  color: var(--text-muted);
}

/* Phones: Week, Month, Year, All time fit on one line. */
@media (max-width: 720px) {
  .times {
    flex-wrap: nowrap;
  }

  .times button {
    flex: 1;
    padding: 0 var(--space-2);
    white-space: nowrap;
  }

  .long {
    display: none;
  }
}

@media (min-width: 721px) {
  .short {
    display: none;
  }
}
</style>
