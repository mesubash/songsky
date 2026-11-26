<script lang="ts">
import { view } from '$lib/view.svelte';
</script>

<nav class="tabs" aria-label="Views">
  <a href="#library" aria-current={view.current === 'library' ? 'page' : undefined}>Library</a>
  <a href="#memories" aria-current={view.current === 'memories' ? 'page' : undefined}>Memories</a>
</nav>

<style>
.tabs {
  display: flex;
  gap: var(--space-6);
  padding-top: var(--space-4);
}

a {
  padding-block: var(--space-2);
  border-bottom: 2px solid transparent;
  color: var(--text-muted);
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--display-weight);
  text-decoration: none;
}

a:hover {
  color: var(--text);
}

a[aria-current="page"] {
  border-bottom-color: var(--accent);
  color: var(--text);
}
</style>
