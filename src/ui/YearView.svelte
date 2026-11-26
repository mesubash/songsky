<script lang="ts">
import { canShareFile, downloadFile, shareFile } from '$lib/art/art.svelte';
import { library } from '$lib/library/library.svelte';
import { memory } from '$lib/memory/memory.svelte';
import { player } from '$lib/player/player.svelte';
import { toast } from '$lib/toast.svelte';
import { renderYear } from '$lib/year/render';
import { describeSky, type Range, yearStats } from '$lib/year/stats';
import Button from './Button.svelte';

/** Your listening in numbers: this month, this year or all time, as a page and a picture. */

const now = new Date();
const RANGES: { id: Range; label: string }[] = [
  { id: 'month', label: 'This month' },
  { id: 'year', label: `${now.getFullYear()}` },
  { id: 'all', label: 'All time' },
];

let range = $state<Range>('year');
const stats = $derived(yearStats(memory.plays, library.byId, range, now));
const playable = $derived(
  stats.topSongs.flatMap((s) => (s.trackId && library.byId.has(s.trackId) ? [s.trackId] : [])),
);

const heading = $derived(
  range === 'month'
    ? `Your ${now.toLocaleDateString('en-GB', { month: 'long' })}`
    : range === 'year'
      ? `Your ${now.getFullYear()}`
      : 'Your Songsky so far',
);

let making = $state(false);

async function picture(share: boolean) {
  making = true;
  try {
    const file = await renderYear(stats, range, now);
    if (share && canShareFile(file)) await shareFile(file, heading);
    else downloadFile(file, 'Picture saved to your downloads.');
  } catch {
    toast.show('Couldn’t draw the picture. Try again.');
  } finally {
    making = false;
  }
}

const shareable = typeof navigator.canShare === 'function';
</script>

<section class="year" aria-labelledby="year-title">
  <div class="head">
    <p class="kind">Your year in Songsky</p>
    <h2 id="year-title">{heading}</h2>
    <fieldset class="segmented">
      <legend class="visually-hidden">Time range</legend>
      {#each RANGES as option (option.id)}
        <button
          type="button"
          aria-pressed={range === option.id}
          onclick={() => (range = option.id)}
        >
          {option.label}
        </button>
      {/each}
    </fieldset>
  </div>

  {#if !stats.plays}
    <div class="empty">
      <p class="big">Nothing played yet</p>
      <p>Play some songs and come back: your top songs, artists and skies will show up here.</p>
    </div>
  {:else}
    <div class="figures">
      <div class="figure">
        <span class="value">{stats.plays.toLocaleString()}</span
        ><span class="label">{stats.plays === 1 ? 'play' : 'plays'}</span>
      </div>
      <div class="figure">
        <span class="value">{stats.minutes.toLocaleString()}</span
        ><span class="label">minutes</span>
      </div>
      <div class="figure">
        <span class="value">{stats.days.toLocaleString()}</span
        ><span class="label">{stats.days === 1 ? 'day' : 'days'} with music</span>
      </div>
    </div>

    <div class="cards">
      <section class="card" aria-labelledby="top-songs">
        <div class="card-head">
          <h3 id="top-songs">Top songs</h3>
          {#if playable.length}
            <Button icon="play" onclick={() => player.playInOrder(playable)}>Play</Button>
          {/if}
        </div>
        <ol>
          {#each stats.topSongs as song, i (song.label + i)}
            <li>
              <span class="n">{i + 1}</span>
              <span class="what"
                ><span class="title">{song.label}</span><span class="sub">{song.sub}</span></span
              >
              <span class="count">{song.count}×</span>
            </li>
          {/each}
        </ol>
      </section>

      <section class="card" aria-labelledby="top-artists">
        <h3 id="top-artists">Top artists</h3>
        <ol>
          {#each stats.topArtists as artist, i (artist.label)}
            <li>
              <span class="n">{i + 1}</span>
              <span class="what"><span class="title">{artist.label}</span></span>
              <span class="count">{artist.count}×</span>
            </li>
          {/each}
        </ol>
      </section>

      {#if stats.sky || stats.topPlace}
        <section class="card facts" aria-label="Your skies and places">
          {#if stats.sky}
            <p class="fact-label">Favourite sky</p>
            <p class="fact">{describeSky(stats.sky)}</p>
            <p class="sub">{stats.sky.count} {stats.sky.count === 1 ? 'play' : 'plays'}</p>
          {/if}
          {#if stats.topPlace}
            <p class="fact-label">Top place</p>
            <p class="fact">{stats.topPlace.label}</p>
            <p class="sub">
              {stats.topPlace.count} {stats.topPlace.count === 1 ? 'play' : 'plays'}
            </p>
          {/if}
        </section>
      {/if}
    </div>

    <div class="share">
      {#if shareable}
        <Button variant="primary" icon="share" disabled={making} onclick={() => picture(true)}
          >Share as a picture</Button
        >
      {/if}
      <Button
        variant={shareable ? undefined : 'primary'}
        icon="download"
        disabled={making}
        onclick={() => picture(false)}
        >Download picture</Button
      >
    </div>
  {/if}
</section>

<style>
.year {
  display: grid;
  gap: var(--space-8);
  padding-block: var(--space-8);
}

.head {
  display: grid;
  gap: var(--space-3);
  justify-items: start;
}

.kind,
.label,
.sub,
.count,
.fact-label,
.empty p {
  color: var(--text-muted);
}

.kind,
.fact-label {
  font-size: var(--text-sm);
  font-weight: 600;
}

h2 {
  font-size: var(--text-3xl);
  letter-spacing: -0.03em;
}

.segmented {
  display: flex;
  gap: 4px;
  min-width: 0;
  margin: 0;
  padding: 4px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--surface-strong);
}

.segmented button {
  min-height: 36px;
  padding: 0 var(--space-4);
  border: 0;
  border-radius: var(--radius-full);
  background: none;
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-weight: 600;
}

.segmented button[aria-pressed="true"] {
  background: var(--accent);
  color: var(--on-accent);
}

.figures {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.figure {
  display: grid;
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.value {
  color: var(--accent);
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: var(--display-weight);
  letter-spacing: -0.03em;
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
  gap: var(--space-4);
  align-items: start;
}

.card {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

h3 {
  font-size: var(--text-lg);
}

ol {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.n {
  width: 1.5rem;
  color: var(--accent);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.what {
  flex: 1;
  display: grid;
  min-width: 0;
}

.title,
.sub {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title {
  font-weight: 600;
}

.sub,
.count {
  font-size: var(--text-sm);
}

.fact {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--display-weight);
}

.facts .sub + .fact-label {
  padding-top: var(--space-3);
}

.share {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.empty {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-8);
  border: 1px dashed var(--line);
  border-radius: var(--radius-lg);
}

.big {
  color: var(--text);
  font-size: var(--text-lg);
  font-weight: 650;
}

@media (max-width: 720px) {
  h2 {
    font-size: var(--text-2xl);
  }

  .figures {
    grid-template-columns: 1fr;
  }

  .figure {
    grid-template-columns: auto 1fr;
    align-items: baseline;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-6);
  }
}
</style>
