<script lang="ts">
import { discover } from '$lib/discover/discover.svelte';
import { library } from '$lib/library/library.svelte';
import { player } from '$lib/player/player.svelte';
import { prefs } from '$lib/prefs.svelte';
import { sky } from '$lib/sky/sky.svelte';
import Button from './Button.svelte';
import Cover from './Cover.svelte';
import Icon from './Icon.svelte';

const PICKS = 6;

// The headline's promise is real: today's picks load right here, ready to play.
$effect(() => {
  void discover.mood.moods;
  void prefs.sources.audius;
  void prefs.sources.jamendo;
  void discover.refresh();
});

const picks = $derived(discover.forSky.slice(0, PICKS));
const ids = $derived(discover.forSky.map((t) => t.id));
const skyNow = $derived(
  sky.weather
    ? `${sky.weather.label}, ${sky.weather.temperature}° right now`
    : 'Following the time of day',
);

function playFrom(index: number) {
  if (!ids.length) return;
  if (player.current?.id === ids[index]) void player.toggle();
  else void player.playList(ids, index);
}
</script>

<section class="home" aria-labelledby="empty-title">
  <div class="intro">
    <p class="now">{skyNow}</p>
    <h2 id="empty-title" class="headline">Music that follows your sky.</h2>
    <p class="lead">
      {#if !prefs.onlineMusic}
        Bring your own music: Songsky plays the songs on this device, and they stay here.
      {:else if !prefs.localMusic}
        Free songs from independent artists, picked to feel
        {discover.mood.moods.join(', ').toLowerCase()}.
      {:else}
        Free songs from independent artists, picked to feel
        {discover.mood.moods.join(', ').toLowerCase()}. Or bring your own music: it stays on this
        device.
      {/if}
    </p>
    <div class="actions">
      {#if discover.hasSongs}
        <Button variant="primary" icon="play" disabled={!picks.length} onclick={() => playFrom(0)}>
          Play songs for your sky
        </Button>
      {/if}
      {#if prefs.localMusic}
        {#if library.canPickFolder}
          <Button icon="folder" onclick={() => library.addFolder()}>Choose a folder</Button>
        {/if}
        <Button icon="plus" onclick={() => library.addFiles()}>
          {library.canPickFolder ? 'Choose files' : 'Choose your songs'}
        </Button>
      {/if}
    </div>
    {#if prefs.localMusic}
      <p class="hint">You can also drop audio files anywhere on this page.</p>
    {/if}
  </div>

  {#if discover.hasSongs}
    <section class="shelf" aria-labelledby="shelf-title">
      <div class="shelf-head">
        <h3 id="shelf-title">{discover.mood.title}</h3>
        <a href="#discover">See all in Discover</a>
      </div>

      <ol class="cards" aria-busy={!picks.length}>
        {#if picks.length}
          {#each picks as track, i (track.id)}
            {@const isCurrent = player.current?.id === track.id}
            <li>
              <button
                class="card"
                class:current={isCurrent}
                type="button"
                aria-label="{isCurrent && player.playing
                  ? 'Pause'
                  : 'Play'} {track.title} by {track.artist}"
                onclick={() => playFrom(i)}
              >
                <span class="art">
                  <Cover coverId={track.coverId} artworkUrl={track.artworkUrl} size={240} fluid />
                  <span class="badge" aria-hidden="true">
                    {#if isCurrent && player.playing}
                      <span class="bars"><i></i><i></i><i></i></span>
                    {:else}
                      <Icon name="play" size={20} />
                    {/if}
                  </span>
                </span>
                <span class="title">{track.title}</span>
                <span class="artist">{track.artist}</span>
              </button>
            </li>
          {/each}
        {:else}
          {#each Array.from({ length: PICKS }, (_, i) => i) as i (i)}
            <li class="placeholder" aria-hidden="true">
              <span class="ph-art"></span>
              <span class="ph-line"></span>
              <span class="ph-line short"></span>
            </li>
          {/each}
        {/if}
      </ol>
      {#if discover.skyStatus === 'error' && !picks.length}
        <p class="hint">Couldn’t reach the free music library. Check your connection.</p>
      {/if}
    </section>
  {/if}
</section>

<style>
/* Sized to fit one screen: spacing and cover size follow the window height. */
.home {
  display: grid;
  gap: clamp(var(--space-6), 4vh, var(--space-12));
  padding-block: clamp(var(--space-4), 4vh, var(--space-12)) 0;
}

.intro {
  display: grid;
  gap: var(--space-4);
  max-width: 42rem;
}

.now {
  color: var(--text-muted);
  font-weight: 550;
}

.headline {
  font-size: var(--text-3xl);
  letter-spacing: -0.03em;
}

.lead {
  max-width: 34rem;
  color: var(--text-muted);
  font-size: var(--text-lg);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding-top: var(--space-2);
}

.hint {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.shelf {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
}

.shelf-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
}

h3 {
  font-size: var(--text-xl);
  letter-spacing: -0.02em;
}

.shelf-head a {
  color: var(--text);
  font-size: var(--text-sm);
  font-weight: 600;
  text-underline-offset: 3px;
}

/* The covers stand on a thin horizon line, the same motif as the logo. */
.cards {
  display: grid;
  grid-auto-flow: column;
  --gap: clamp(var(--space-3), 2vw, var(--space-6));

  /* Six covers across, but only as tall as the room left in the window: the window
     height minus everything else on this screen (header, intro, titles, player bar). */
  --chrome: 690px;

  grid-auto-columns: max(
    7rem,
    min(calc((100% - 5 * var(--gap)) / 6), calc(100dvh - var(--chrome)))
  );
  justify-content: space-between;
  gap: var(--gap);
  margin: 0;
  padding: 0 0 var(--space-6);
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 55%, transparent);
  list-style: none;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.cards::-webkit-scrollbar {
  display: none;
}

.cards li {
  scroll-snap-align: start;
  min-width: 0;
}

.card {
  display: grid;
  gap: var(--space-1);
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  text-align: start;
}

.art {
  position: relative;
  display: block;
  margin-bottom: var(--space-2);
  border-radius: var(--radius-md);
  box-shadow: 0 18px 40px -22px rgb(0 0 0 / 0.6);
  transition: transform 220ms var(--ease-out);
}

.art :global(.cover) {
  border-radius: var(--radius-md);
}

.card:hover .art,
.card:focus-visible .art {
  transform: translateY(-4px);
}

.badge {
  position: absolute;
  right: var(--space-2);
  bottom: var(--space-2);
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.card:hover .badge,
.card:focus-visible .badge,
.card.current .badge {
  opacity: 1;
  transform: none;
}

.title,
.artist {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title {
  font-weight: 600;
}

.card.current .title {
  color: var(--accent);
}

.artist {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.bars {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 16px;
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

.placeholder {
  display: grid;
  gap: var(--space-2);
}

.ph-art,
.ph-line {
  background: var(--surface-strong);
  box-shadow: none;
  animation: pulse 1.4s ease-in-out infinite alternate;
}

.ph-art {
  aspect-ratio: 1;
  margin-bottom: var(--space-2);
  border-radius: var(--radius-md);
}

.ph-line {
  height: 10px;
  width: 80%;
  border-radius: var(--radius-full);
}

.ph-line.short {
  width: 50%;
}

/* The player bar takes about 80px more. */
:global(.has-player) .cards {
  --chrome: 770px;
}

/* Short windows (most laptops): a smaller headline and intro, so the screen still fits. */
@media (min-width: 721px) and (max-height: 860px) {
  .intro {
    gap: var(--space-3);
  }

  .headline {
    font-size: var(--text-2xl);
  }

  .lead {
    font-size: var(--text-base);
  }

  .cards {
    --chrome: 560px;
  }

  :global(.has-player) .cards {
    --chrome: 640px;
  }
}

/* Narrow screens: the shelf scrolls sideways, about two and a half covers at a time. */
@media (max-width: 720px) {
  .cards {
    grid-auto-columns: 42%;
    margin-inline: calc(var(--gutter) * -1);
    padding-inline: var(--gutter);
    scroll-padding-inline: var(--gutter);
  }
}

@keyframes bounce {
  from {
    transform: scaleY(0.25);
  }
}

@keyframes pulse {
  from {
    opacity: 0.45;
  }
}
</style>
