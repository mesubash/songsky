import type { Action } from 'svelte/action';

/** `use:modal={open}` keeps a native <dialog> in sync with an `open` flag. */
export const modal: Action<HTMLDialogElement, boolean> = (dialog, open) => {
  const sync = (shouldOpen: boolean) => {
    if (shouldOpen && !dialog.open) {
      dialog.showModal();
      // Full-screen dialogs focus themselves, so no button shows a focus ring on open.
      // Keyboard users still get rings as soon as they press Tab.
      if (dialog.hasAttribute('data-focus-self')) dialog.focus();
    } else if (!shouldOpen && dialog.open) dialog.close();
  };
  sync(open);
  return { update: sync };
};
