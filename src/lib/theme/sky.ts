/** Time-of-day sky that drives the app's colour theme. Weather joins in a later stage. */
export type Sky = 'dawn' | 'day' | 'dusk' | 'night';

export function skyForHour(hour: number): Sky {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

export function applySky(sky: Sky, root: HTMLElement = document.documentElement): void {
  root.dataset.sky = sky;
}
