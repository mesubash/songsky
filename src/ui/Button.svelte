<script lang="ts">
import type { Snippet } from 'svelte';
import type { HTMLButtonAttributes } from 'svelte/elements';
import Icon, { type IconName } from './Icon.svelte';

type Variant = 'primary' | 'quiet' | 'icon';

let {
  variant = 'quiet',
  icon,
  iconSize = 20,
  active = false,
  children,
  ...rest
}: HTMLButtonAttributes & {
  variant?: Variant;
  icon?: IconName;
  iconSize?: number;
  /** Toggle buttons (shuffle, repeat) show an "on" state. */
  active?: boolean;
  children?: Snippet;
} = $props();
</script>

<button class="button {variant}" class:active type="button" {...rest}>
  {#if icon}
    <Icon name={icon} size={iconSize} />
  {/if}
  {#if children}
    <span class="label">{@render children()}</span>
  {/if}
</button>

<style>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 44px;
  border: 0;
  border-radius: var(--radius-full);
  background: none;
  font-weight: 600;
  white-space: nowrap;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.button:active:not(:disabled) {
  transform: scale(0.96);
}

.primary {
  padding: 0 var(--space-6);
  background: var(--accent);
  color: var(--on-accent);
}

.primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent) 88%, var(--text));
}

.quiet {
  padding: 0 var(--space-4);
  background: var(--surface);
}

.quiet:hover:not(:disabled) {
  background: var(--surface-strong);
}

.icon {
  width: 44px;
  padding: 0;
  color: var(--text-muted);
}

.icon:hover:not(:disabled) {
  color: var(--text);
  background: var(--surface);
}

.quiet.active {
  background: var(--accent);
  color: var(--on-accent);
}

.icon.active {
  color: var(--accent);
}
</style>
