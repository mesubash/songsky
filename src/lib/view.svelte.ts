export type View = 'library' | 'discover' | 'memories' | 'playlist' | 'settings';

const PLAYLIST_PREFIX = '#playlist/';

const fromHash = (): View =>
  location.hash === '#memories'
    ? 'memories'
    : location.hash === '#settings'
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

  constructor() {
    addEventListener('hashchange', () => {
      this.current = fromHash();
      this.playlistId = playlistFromHash();
    });
  }
}

export const view = new ViewState();
