export type View = 'library' | 'discover' | 'memories';

const fromHash = (): View =>
  location.hash === '#memories'
    ? 'memories'
    : location.hash === '#discover'
      ? 'discover'
      : 'library';

/** The current view, kept in the URL hash so links and the back button work. */
class ViewState {
  current = $state<View>(fromHash());

  constructor() {
    addEventListener('hashchange', () => {
      this.current = fromHash();
    });
  }
}

export const view = new ViewState();
