<script lang="ts">
import { LIVE_LOGO_COLORS, logoSvg } from '$lib/sky/logo';

/** The Songsky mark. Its colours follow the sky, and it becomes a moon at night. */
let { size = 32 }: { size?: number } = $props();

// Built once from CSS variables; the sky theme changes the colours, not the markup.
const svg = logoSvg(LIVE_LOGO_COLORS, 'header-logo');
</script>

<!-- Decorative: the wordmark next to it carries the name. -->
<span class="logo" style:--size="{size}px" aria-hidden="true">{@html svg}</span>

<style>
.logo {
  flex: none;
  display: block;
  width: var(--size);
  height: var(--size);
}

.logo :global(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

.logo :global(stop),
.logo :global(circle),
.logo :global(rect),
.logo :global(g) {
  transition:
    stop-color var(--duration-sky) var(--ease-out),
    fill var(--duration-sky) var(--ease-out),
    stroke var(--duration-sky) var(--ease-out),
    opacity var(--duration-sky) var(--ease-out),
    filter var(--duration-sky) var(--ease-out);
}
</style>
