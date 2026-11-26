<script lang="ts" module>
// Fill icons are solid shapes; the rest are 2px strokes on a 24px grid.
const ICONS = {
  play: {
    d: 'M8 5.6v12.8a1 1 0 0 0 1.5.86l10.6-6.4a1 1 0 0 0 0-1.72L9.5 4.74A1 1 0 0 0 8 5.6z',
    fill: true,
  },
  pause: { d: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z', fill: true },
  next: {
    d: 'M5 6.3v11.4a.8.8 0 0 0 1.24.67L15 12.6V18h2.2V6H15v5.4L6.24 5.63A.8.8 0 0 0 5 6.3z',
    fill: true,
  },
  prev: {
    d: 'M19 6.3v11.4a.8.8 0 0 1-1.24.67L9 12.6V18H6.8V6H9v5.4l8.76-5.77A.8.8 0 0 1 19 6.3z',
    fill: true,
  },
  shuffle: { d: 'M16 4h4v4M4 19 20 4M20 16v4h-4M15 15l5 5M4 5l5 5', fill: false },
  repeat: {
    d: 'M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4',
    fill: false,
  },
  'repeat-one': {
    d: 'M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4M11 10.5l1.5-1V15',
    fill: false,
  },
  volume: { d: 'M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13', fill: false },
  mute: { d: 'M11 5 6 9H3v6h3l5 4zM22 9l-6 6M16 9l6 6', fill: false },
  folder: {
    d: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    fill: false,
  },
  plus: { d: 'M12 5v14M5 12h14', fill: false },
  'chevron-down': { d: 'M6 9l6 6 6-6', fill: false },
  sliders: {
    d: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
    fill: false,
  },
  close: { d: 'M6 6l12 12M18 6 6 18', fill: false },
  sun: {
    d: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    fill: false,
  },
  moon: { d: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z', fill: false },
  cloud: { d: 'M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 11 3.5 3.5 0 0 0 7 18z', fill: false },
  rain: {
    d: 'M7 15h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 8 3.5 3.5 0 0 0 7 15zM9 18l-1 3M13 18l-1 3M17 18l-1 3',
    fill: false,
  },
  snow: {
    d: 'M7 15h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 8 3.5 3.5 0 0 0 7 15zM8 19h.01M12 21h.01M16 19h.01',
    fill: false,
  },
  storm: {
    d: 'M7 15h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 8 3.5 3.5 0 0 0 7 15zM13 16l-2 3h3l-2 3',
    fill: false,
  },
  fog: { d: 'M4 9h16M6 13h12M4 17h16', fill: false },
  pin: {
    d: 'M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    fill: false,
  },
  search: { d: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5', fill: false },
  share: { d: 'M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5', fill: false },
  walk: {
    d: 'M13.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM9 20l2.5-5.5L14 17v4M6 12l2-4 4-1 3 4 3 1M11.5 14.5 12 9',
    fill: false,
  },
  users: {
    d: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM22 19v-1a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    fill: false,
  },
  send: { d: 'M4 12 20 4l-6 16-3-7zM11 13l9-9', fill: false },
  copy: { d: 'M9 9h11v11H9zM5 15H4V4h11v1', fill: false },
  heart: {
    d: 'M12 20s-7-4.4-9.2-8.7C1.3 8.4 3 5 6.4 5c2 0 3.4 1.1 4.1 2.3h3c.7-1.2 2.1-2.3 4.1-2.3C21 5 22.7 8.4 21.2 11.3 19 15.6 12 20 12 20z',
    fill: false,
  },
  external: {
    d: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
    fill: false,
  },
  disc: {
    d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    fill: false,
  },
  music: {
    d: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
    fill: false,
  },
} as const;

export type IconName = keyof typeof ICONS;
</script>

<script lang="ts">
let { name, size = 20 }: { name: IconName; size?: number } = $props();
const icon = $derived(ICONS[name]);
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  aria-hidden="true"
  fill={icon.fill ? 'currentColor' : 'none'}
  stroke={icon.fill ? 'none' : 'currentColor'}
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d={icon.d} />
</svg>
