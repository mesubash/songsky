/** Colours for the Songsky mark. Values can be CSS colours or var() references. */
export interface LogoColors {
  top: string;
  mid: string;
  horizon: string;
  sun: string;
  ground: string;
  /** 0 by day; 1 at night cuts the sun into a crescent moon. */
  moon: string;
  /** CSS filter for the sky behind the note (the weather tint), or "none". */
  filter: string;
}

/**
 * The Songsky mark as SVG: a music note whose head is the sun on the horizon.
 * One source for the in-page logo (fed CSS variables) and the tab icon (fed resolved
 * colours). `id` keeps gradient ids unique when several logos share a page.
 */
export function logoSvg(c: LogoColors, id = 'logo'): string {
  const filter = c.filter && c.filter !== 'none' ? ` style="filter:${c.filter}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs>
<linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${c.top}"/><stop offset=".62" style="stop-color:${c.mid}"/><stop offset="1" style="stop-color:${c.horizon}"/></linearGradient>
<radialGradient id="${id}-glow" cx=".5" cy=".7" r=".6"><stop offset="0" style="stop-color:${c.sun};stop-opacity:.5"/><stop offset="1" style="stop-color:${c.sun};stop-opacity:0"/></radialGradient>
<clipPath id="${id}-tile"><rect width="64" height="64" rx="14"/></clipPath>
<clipPath id="${id}-above"><rect width="64" height="44"/></clipPath>
<mask id="${id}-moon"><rect width="64" height="64" fill="#fff"/><circle cx="34" cy="38.5" r="9" fill="#000" style="opacity:${c.moon}"/></mask>
</defs>
<g clip-path="url(#${id}-tile)">
<g${filter}><rect width="64" height="64" fill="url(#${id}-sky)"/><rect width="64" height="64" fill="url(#${id}-glow)"/></g>
<rect y="44" width="64" height="20" style="fill:${c.ground}"/>
<g clip-path="url(#${id}-above)"><circle cx="27" cy="44" r="11" mask="url(#${id}-moon)" style="fill:${c.sun}"/></g>
<g fill="none" stroke-linecap="round" stroke-width="3.4" style="stroke:${c.sun}"><path d="M36.5 44V15"/><path d="M36.5 15c3.5 5.5 10.5 6.5 10.5 14"/></g>
<g stroke-linecap="round" stroke-width="2.4" style="stroke:${c.sun}"><path d="M18 50h18" opacity=".55"/><path d="M22 55h10" opacity=".3"/></g>
</g>
</svg>`;
}

/** The in-page logo reads the sky's CSS variables, so it changes with the theme. */
export const LIVE_LOGO_COLORS: LogoColors = {
  top: 'var(--logo-top)',
  mid: 'var(--logo-mid)',
  horizon: 'var(--logo-horizon)',
  sun: 'var(--logo-sun)',
  ground: 'var(--logo-ground)',
  moon: 'var(--logo-moon)',
  filter: 'var(--sky-filter)',
};

/** Resolves the logo variables to real colours, for places CSS can't reach (the tab icon). */
export function resolvedLogoColors(root: Element): LogoColors {
  const styles = getComputedStyle(root);
  const read = (name: string) => styles.getPropertyValue(name).trim();
  return {
    top: read('--logo-top'),
    mid: read('--logo-mid'),
    horizon: read('--logo-horizon'),
    sun: read('--logo-sun'),
    ground: read('--logo-ground'),
    moon: read('--logo-moon') || '0',
    filter: read('--sky-filter') || 'none',
  };
}
