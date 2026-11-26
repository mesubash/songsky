<script lang="ts">
/** Placeholder rows shown while songs load, shaped like the real track list. */
let { rows = 6, label = 'Loading songs' }: { rows?: number; label?: string } = $props();
</script>

<div class="skeleton" role="status" aria-label={label}>
  {#each Array.from({ length: rows }, (_, i) => i) as i (i)}
    <div class="row" style:--delay="{i * 80}ms">
      <span class="cover"></span>
      <span class="lines">
        <span class="line long"></span>
        <span class="line short"></span>
      </span>
    </div>
  {/each}
</div>

<style>
.skeleton {
  display: grid;
  gap: var(--space-1);
}

.row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-height: 60px;
  padding: var(--space-2) var(--space-3);
}

.cover,
.line {
  background: var(--surface-strong);
  animation: pulse 1.4s ease-in-out var(--delay) infinite alternate;
}

.cover {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
}

.lines {
  display: grid;
  flex: 1;
  gap: var(--space-2);
}

.line {
  height: 10px;
  border-radius: var(--radius-full);
}

.long {
  width: min(60%, 18rem);
}

.short {
  width: min(35%, 9rem);
}

@keyframes pulse {
  from {
    opacity: 0.45;
  }
}
</style>
