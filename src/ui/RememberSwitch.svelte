<script lang="ts">
import { memory } from '$lib/memory/memory.svelte';

/** Turns remembering places on or off: in the page on phones, in the top bar on desktop. */
</script>

<label class="switch">
  <input
    type="checkbox"
    role="switch"
    aria-checked={memory.rememberPlaces}
    checked={memory.rememberPlaces}
    onchange={(e) => memory.setRememberPlaces(e.currentTarget.checked)}
  >
  <span>Remember where I listen</span>
</label>

<style>
.switch {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 44px;
  cursor: pointer;
}

.switch input {
  width: 44px;
  height: 26px;
  margin: 0;
  border-radius: var(--radius-full);
  background: var(--line);
  appearance: none;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.switch input::before {
  content: "";
  display: block;
  width: 20px;
  height: 20px;
  margin: 3px;
  border-radius: 50%;
  background: var(--text);
  transition: transform var(--duration-fast) var(--ease-out);
}

.switch input:checked {
  background: var(--accent);
}

.switch input:checked::before {
  background: var(--on-accent);
  transform: translateX(18px);
}
</style>
