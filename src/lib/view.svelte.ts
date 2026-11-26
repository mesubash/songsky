export type View = 'library' | 'discover' | 'memories' | 'playlist' | 'settings';

const PLAYLIST_PREFIX = '#playlist/';
const SETTINGS_PREFIX = '#settings/';
const LIBRARY_PREFIX = '#library/';

/**
 * A group of the library: `local` (your files), `online` (saved songs), `files` (added one
 * by one) or `folder:<name>`. In the address as #library/local or #library/folder/Music.
 */
const libraryGroupFromHash = (): string => {
  if (!location.hash.startsWith(LIBRARY_PREFIX)) return 'all';
  const rest = decodeURIComponent(location.hash.slice(LIBRARY_PREFIX.length));
  return rest.startsWith('folder/') ? `folder:${rest.slice('folder/'.length)}` : rest || 'all';
};

export const libraryHref = (group: string): string =>
  group === 'all'
    ? '#library'
    : group.startsWith('folder:')
      ? `${LIBRARY_PREFIX}folder/${encodeURIComponent(group.slice('folder:'.length))}`
      : `${LIBRARY_PREFIX}${group}`;
const DISCOVER_PREFIX = '#discover/';

export type DiscoverTab = 'for-you' | 'genres' | 'playlists' | 'radio';
const DISCOVER_TABS: DiscoverTab[] = ['for-you', 'genres', 'playlists', 'radio'];

/** The open Discover tab (`#discover/radio`); "For you" when none is given. */
const discoverTabFromHash = (): DiscoverTab =>
  DISCOVER_TABS.find((tab) => location.hash === `${DISCOVER_PREFIX}${tab}`) ?? 'for-you';

/** The open settings section (`#settings/sound`), or null for the list of sections. */
const settingsFromHash = (): string | null =>
  location.hash.startsWith(SETTINGS_PREFIX) ? location.hash.slice(SETTINGS_PREFIX.length) : null;

const fromHash = (): View =>
  location.hash === '#memories'
    ? 'memories'
    : location.hash === '#settings' || location.hash.startsWith(SETTINGS_PREFIX)
      ? 'settings'
      : location.hash === '#discover' || location.hash.startsWith(DISCOVER_PREFIX)
        ? 'discover'
        : location.hash.startsWith(PLAYLIST_PREFIX)
          ? 'playlist'
          : 'library';

const playlistFromHash = (): string | null =>
  location.hash.startsWith(PLAYLIST_PREFIX)
    ? decodeURIComponent(location.hash.slice(PLAYLIST_PREFIX.length))
    : null;

export const playlistHref = (id: string) => `${PLAYLIST_PREFIX}${encodeURIComponent(id)}`;

/** The current view, kept in the URL hash so links and the back button work. */
class ViewState {
  current = $state<View>(fromHash());
  /** The open playlist, on the playlist view. */
  playlistId = $state<string | null>(playlistFromHash());
  settingsSection = $state<string | null>(settingsFromHash());
  discoverTab = $state<DiscoverTab>(discoverTabFromHash());
  libraryGroup = $state(libraryGroupFromHash());

  constructor() {
    addEventListener('hashchange', () => {
      this.current = fromHash();
      this.playlistId = playlistFromHash();
      this.settingsSection = settingsFromHash();
      this.discoverTab = discoverTabFromHash();
      this.libraryGroup = libraryGroupFromHash();
    });
  }
}

export const view = new ViewState();
