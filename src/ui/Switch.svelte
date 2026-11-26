<script lang="ts">
/** An on/off switch. `bare` hides the text (still read by screen readers) where a
    settings row already says what it does. */
let {
  checked,
  label,
  onchange,
  bare = false,
}: { checked: boolean; label: string; onchange: (on: boolean) => void; bare?: boolean } = $props();
</script>

<label class="switch">
  <input
    type="checkbox"
    role="switch"
    aria-checked={checked}
    {checked}
    onchange={(e) => onchange(e.currentTarget.checked)}
  >
  <span class:visually-hidden={bare}>{label}</span>
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
