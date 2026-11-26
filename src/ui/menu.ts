/** Puts a popover menu under its button, or above it when there's no room below,
    keeping it inside the window, then focuses its first item. */
export function placeMenu(button: HTMLElement, menu: HTMLElement): void {
  const at = button.getBoundingClientRect();
  const height = menu.offsetHeight;
  const below = at.bottom + 4 + height < innerHeight;
  menu.style.top = `${Math.max(8, below ? at.bottom + 4 : at.top - height - 4)}px`;
  const left = Math.min(at.right - menu.offsetWidth, innerWidth - menu.offsetWidth - 8);
  menu.style.left = `${Math.max(8, left)}px`;
  menu.querySelector('button')?.focus();
}
