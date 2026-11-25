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
