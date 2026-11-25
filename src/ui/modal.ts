import type { Action } from 'svelte/action';

/** `use:modal={open}` keeps a native <dialog> in sync with an `open` flag. */
export const modal: Action<HTMLDialogElement, boolean> = (dialog, open) => {
  const sync = (shouldOpen: boolean) => {
    if (shouldOpen && !dialog.open) dialog.showModal();
    else if (!shouldOpen && dialog.open) dialog.close();
  };
  sync(open);
  return { update: sync };
};
