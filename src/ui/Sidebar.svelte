<script lang="ts">
import { discover } from '$lib/discover/discover.svelte';
import { library } from '$lib/library/library.svelte';
import { memory } from '$lib/memory/memory.svelte';
import { player } from '$lib/player/player.svelte';
import { playlists } from '$lib/playlists/playlists.svelte';
import { sky } from '$lib/sky/sky.svelte';
import { playlistHref, type View, view } from '$lib/view.svelte';
import Cover from './Cover.svelte';
import Icon, { type IconName } from './Icon.svelte';
import Logo from './Logo.svelte';

/** Desktop only: navigation, the sky, and what you played last. Phones use the tabs instead. */

const RECENT = 6;

const NAV: { view: View; label: string; icon: IconName; href: string }[] = [
  { view: 'library', label: 'Library', icon: 'music', href: '#library' },
  { view: 'discover', label: 'Discover', icon: 'disc', href: '#discover' },
  { view: 'memories', label: 'Memories', icon: 'pin', href: '#memories' },
];

/** The last few different songs played, newest first. */
const recent = $derived.by(() => {
  const seen = new Set<string>();
  const tracks = [];
  for (const play of memory.plays) {
    const track = library.byId.get(play.trackId);
    if (!track || seen.has(track.id)) continue;
    seen.add(track.id);
    tracks.push(track);
    if (tracks.length === RECENT) break;
  }
  return tracks;
});

const skyLine = $derived(
  sky.weather ? `${sky.weather.label}, ${sky.weather.temperature}°` : 'Following the time of day',
);

async function newPlaylist() {
  const playlist = await playlists.create();
  location.hash = playlistHref(playlist.id);
}

function playRecent(id: string) {
  const ids = library.tracks.map((t) => t.id);
  const index = ids.indexOf(id);
  void (index >= 0 ? player.playList(ids, index) : player.playList([id]));
}
</script>

<aside class="sidebar" aria-label="Songsky">
  <!-- Decorative: the page heading with the name lives in the header. -->
  <div class="brand" aria-hidden="true">
    <Logo size={36} />
    <span>songsky</span>
  </div>

  <nav aria-label="Views">
    <ul>
      {#each NAV as item (item.view)}
        <li>
          <a href={item.href} aria-current={view.current === item.view ? 'page' : undefined}>
            <Icon name={item.icon} size={20} />
            <span class="label">{item.label}</span>
            {#if item.view === 'library' && library.tracks.length}
              <span class="count">{library.tracks.length}</span>
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  </nav>

  <section class="playlists" aria-labelledby="playlists-title">
    <div class="section-head">
      <h2 id="playlists-title">Playlists</h2>
      <button
        class="new"
        type="button"
        aria-label="New playlist"
        title="New playlist"
        onclick={newPlaylist}
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
    {#if playlists.list.length}
      <ul>
        {#each playlists.list as playlist (playlist.id)}
          <li>
            <a
              class="playlist-link"
              href={playlistHref(playlist.id)}
              aria-current={view.current === 'playlist' && view.playlistId === playlist.id
                ? 'page'
                : undefined}
              >{playlist.name}</a
            >
          </li>
        {/each}
      </ul>
    {:else}
      <p class="none">Make one with + or from any song’s ⋯ menu.</p>
    {/if}
  </section>

  <a class="sky-card" href="#discover">
    <span class="sky-line">{skyLine}</span>
    <span class="sky-title">{discover.mood.title}</span>
    <span class="sky-hint">Songs picked for your sky</span>
  </a>

  {#if recent.length}
    <section class="recent" aria-labelledby="recent-title">
      <h2 id="recent-title">Recently played</h2>
      <ul>
        {#each recent as track (track.id)}
          <li>
            <button
              type="button"
              class:current={player.current?.id === track.id}
              onclick={() => playRecent(track.id)}
            >
              <Cover coverId={track.coverId} artworkUrl={track.artworkUrl} size={36} />
              <span class="text">
                <span class="title">{track.title}</span>
                <span class="artist">{track.artist}</span>
              </span>
            </button>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <p class="keys-hint">Press <kbd>?</kbd> for keyboard shortcuts</p>
</aside>

<style>
.sidebar {
  display: none;
}

@media (min-width: 1100px) {
  .sidebar {
    position: sticky;
    top: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    height: 100dvh;
    padding: var(--space-6) var(--space-4) var(--space-6) var(--space-6);
    overflow-y: auto;
    border-right: 1px solid var(--line);
    background: color-mix(in srgb, var(--sky-top) 18%, transparent);
  }

  :global(.has-player) .sidebar {
    padding-bottom: calc(var(--space-6) + 96px);
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--text);
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--display-weight);
  letter-spacing: -0.03em;
}

nav ul,
.recent ul {
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

nav a {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 44px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-weight: 550;
  text-decoration: none;
}

nav a:hover {
  background: var(--surface);
  color: var(--text);
}

.playlists {
  display: grid;
  gap: var(--space-1);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: var(--space-3);
}

.section-head h2,
.recent h2 {
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
}

.new {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--text-muted);
}

.new:hover {
  background: var(--surface);
  color: var(--text);
}

.playlists ul {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}

.none {
  padding-inline: var(--space-3);
  color: var(--text-muted);
  font-size: var(--text-xs);
}

nav a[aria-current="page"] {
  background: var(--surface-strong);
  color: var(--text);
}

.label {
  flex: 1;
}

.count {
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
}

.sky-card {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--text);
  text-decoration: none;
}

.sky-card:hover {
  background: var(--surface-strong);
}

.sky-line,
.sky-hint {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.sky-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--display-weight);
  letter-spacing: -0.02em;
  line-height: 1.15;
}

/* Recently played takes the space that's left and scrolls inside it, so nothing
   below it gets covered on short windows. */
.recent {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: 6rem;
}

.recent ul {
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
}

.recent h2 {
  padding-inline: var(--space-3);
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
}

.recent button {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 0;
  border-radius: var(--radius-md);
  background: none;
  text-align: start;
}

.recent button:hover {
  background: var(--surface);
}

.text {
  display: grid;
  min-width: 0;
}

.title,
.artist {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title {
  font-size: var(--text-sm);
  font-weight: 550;
}

.artist {
  color: var(--text-muted);
  font-size: var(--text-xs);
}

.keys-hint {
  flex: none;
  margin-top: auto;
  padding-inline: var(--space-3);
  color: var(--text-muted);
  font-size: var(--text-xs);
}

.keys-hint kbd {
  padding: 0 5px;
  border: 1px solid var(--line);
  border-radius: 4px;
  font-family: var(--font-sans);
}

.recent button.current .title {
  color: var(--accent);
}
.playlist-link {
  display: block;
  overflow: hidden;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-weight: 550;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-link:hover {
  background: var(--surface);
  color: var(--text);
}

.playlist-link[aria-current="page"] {
  background: var(--surface-strong);
  color: var(--text);
}
</style>
