import { logoSvg, resolvedLogoColors } from './logo';

/**
 * Repaints the browser tab icon and the mobile browser bar to match the current sky.
 * (An installed app's home-screen icon can't change: the phone keeps the one it saved.)
 */
export function updateTabIcon(): void {
  const root = document.documentElement;
  const href = `data:image/svg+xml,${encodeURIComponent(logoSvg(resolvedLogoColors(root), 'tab'))}`;
  for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')) {
    link.href = href;
    link.type = 'image/svg+xml';
    link.removeAttribute('sizes');
  }
  const skyTop = getComputedStyle(root).getPropertyValue('--sky-top').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', skyTop);
}
