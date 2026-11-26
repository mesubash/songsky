<script lang="ts">
import { prefs } from '$lib/prefs.svelte';
import { type View, view } from '$lib/view.svelte';
import Icon, { type IconName } from './Icon.svelte';

/** Phones and tablets: a tab bar along the bottom, where thumbs reach. Desktop has the sidebar. */
const TABS: { view: View; label: string; icon: IconName; href: string }[] = [
  { view: 'library', label: 'Library', icon: 'music', href: '#library' },
  { view: 'discover', label: 'Discover', icon: 'disc', href: '#discover' },
  { view: 'memories', label: 'Memories', icon: 'pin', href: '#memories' },
  { view: 'settings', label: 'Settings', icon: 'settings', href: '#settings' },
];

const current = (tab: View) =>
  view.current === tab ||
  (tab === 'library' && (view.current === 'playlist' || view.current === 'shared')) ||
  (tab === 'memories' && view.current === 'year');
</script>

<nav class="tabbar" aria-label="Views">
  {#each TABS.filter((t) => t.view !== 'discover' || prefs.onlineMusic) as tab (tab.view)}
    <a href={tab.href} aria-current={current(tab.view) ? 'page' : undefined}>
      <Icon name={tab.icon} size={22} />
      <span>{tab.label}</span>
    </a>
  {/each}
</nav>

<style>
.tabbar {
  position: fixed;
  inset: auto 0 0;
  z-index: 11;
  display: flex;
  height: var(--tabbar);
  padding-bottom: env(safe-area-inset-bottom);
  border-top: 1px solid var(--line);
  background: var(--sky-top);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
}

a {
  flex: 1;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 2px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}

a[aria-current="page"] {
  color: var(--text);
}

/* The chosen tab's icon sits on a soft pill, as in phone apps. */
a :global(svg) {
  width: 56px;
  height: 28px;
  padding: 3px 0;
  border-radius: var(--radius-full);
  transition: background-color var(--duration-fast) var(--ease-out);
}

a[aria-current="page"] :global(svg) {
  background: color-mix(in srgb, var(--accent) 22%, transparent);
  color: var(--accent);
}

/* Desktop uses the sidebar instead. */
@media (min-width: 1100px) {
  .tabbar {
    display: none;
  }
}
</style>
