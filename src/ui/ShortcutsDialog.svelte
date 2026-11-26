<script lang="ts">
import { SHORTCUTS } from '$lib/keys/shortcuts';
import Button from './Button.svelte';
import { modal } from './modal';

let { open = $bindable(false) }: { open?: boolean } = $props();

function closeOnBackdrop(event: MouseEvent) {
  if (event.target === event.currentTarget) open = false;
}
</script>

<!-- biome-ignore lint/a11y/useKeyWithClickEvents: Escape already closes the native dialog; this only handles backdrop clicks. -->
<dialog
  class="shortcuts"
  use:modal={open}
  aria-labelledby="shortcuts-title"
  onclose={() => (open = false)}
  onclick={closeOnBackdrop}
>
  <div class="content">
    <header>
      <h2 id="shortcuts-title">Keyboard shortcuts</h2>
      <Button variant="icon" icon="close" aria-label="Close" onclick={() => (open = false)} />
    </header>
    <dl>
      {#each SHORTCUTS as shortcut (shortcut.label)}
        <div class="row">
          <dt>{shortcut.label}</dt>
          <dd>
            {#each shortcut.keys as key, i (key)}
              {#if i > 0 && shortcut.keys[0] !== 'Shift'}
                <span class="or">or</span>
              {/if}
              <kbd>{key}</kbd>
            {/each}
          </dd>
        </div>
      {/each}
    </dl>
  </div>
</dialog>

<style>
.shortcuts {
  width: min(100% - 2rem, 32rem);
  max-height: calc(100dvh - 2rem);
  margin: auto;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--sky-top) 92%, var(--text));
  color: var(--text);
}

.shortcuts::backdrop {
  background: rgb(0 0 0 / 0.4);
}

.content {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-6) var(--space-6);
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-inline-end: calc(var(--space-3) * -1);
}

h2 {
  font-size: var(--text-xl);
  letter-spacing: -0.02em;
}

dl {
  display: grid;
  margin: 0;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  min-height: 40px;
  border-bottom: 1px solid var(--line);
}

dd {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin: 0;
}

kbd {
  min-width: 28px;
  padding: 2px var(--space-2);
  border: 1px solid var(--line);
  border-bottom-width: 2px;
  border-radius: 6px;
  background: var(--surface);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  text-align: center;
}

.or {
  color: var(--text-muted);
  font-size: var(--text-sm);
}
</style>
