export type View = 'library' | 'discover' | 'memories' | 'playlist' | 'settings';

const PLAYLIST_PREFIX = '#playlist/';
const SETTINGS_PREFIX = '#settings/';

/** The open settings section (`#settings/sound`), or null for the list of sections. */
const settingsFromHash = (): string | null =>
  location.hash.startsWith(SETTINGS_PREFIX) ? location.hash.slice(SETTINGS_PREFIX.length) : null;

const fromHash = (): View =>
  location.hash === '#memories'
    ? 'memories'
    : location.hash === '#settings' || location.hash.startsWith(SETTINGS_PREFIX)
      ? 'settings'
      : location.hash === '#discover'
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

  constructor() {
    addEventListener('hashchange', () => {
      this.current = fromHash();
      this.playlistId = playlistFromHash();
      this.settingsSection = settingsFromHash();
    });
  }
}

export const view = new ViewState();
