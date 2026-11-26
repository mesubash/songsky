<script lang="ts">
import { confirmation } from '$lib/confirm.svelte';
import { modal } from './modal';

/** Shows whatever `ask()` requested. Cancel is focused first, so Enter never deletes by
    accident; Escape or clicking outside also cancels. */
let cancel = $state<HTMLButtonElement>();

$effect(() => {
  if (confirmation.request) requestAnimationFrame(() => cancel?.focus());
});

function closeOnBackdrop(event: MouseEvent) {
  if (event.target === event.currentTarget) confirmation.answer(false);
}
</script>

<!-- biome-ignore lint/a11y/useKeyWithClickEvents: Escape already closes the native dialog; this only handles backdrop clicks. -->
<dialog
  class="confirm"
  use:modal={!!confirmation.request}
  role="alertdialog"
  aria-labelledby="confirm-title"
  aria-describedby="confirm-message"
  onclose={() => confirmation.request && confirmation.answer(false)}
  onclick={closeOnBackdrop}
>
  {#if confirmation.request}
    <div class="content">
      <h2 id="confirm-title">{confirmation.request.title}</h2>
      <p id="confirm-message">{confirmation.request.message}</p>
      <div class="actions">
        <button
          bind:this={cancel}
          class="cancel"
          type="button"
          onclick={() => confirmation.answer(false)}
        >
          Cancel
        </button>
        <button class="danger" type="button" onclick={() => confirmation.answer(true)}>
          {confirmation.request.action}
        </button>
      </div>
    </div>
  {/if}
</dialog>

<style>
.confirm {
  width: min(100% - 2rem, 26rem);
  margin: auto;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--sky-top) 94%, var(--text));
  box-shadow: 0 24px 60px -20px rgb(0 0 0 / 0.5);
  color: var(--text);
}

.confirm::backdrop {
  background: rgb(0 0 0 / 0.45);
}

.confirm[open] {
  animation: appear 180ms var(--ease-out);
}

.content {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-6);
}

h2 {
  font-size: var(--text-xl);
  letter-spacing: -0.02em;
}

p {
  color: var(--text-muted);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding-top: var(--space-3);
}

.actions button {
  min-height: 44px;
  padding: 0 var(--space-5, 20px);
  border: 0;
  border-radius: var(--radius-full);
  font-weight: 600;
}

.cancel {
  background: var(--surface-strong);
  color: var(--text);
}

/* A deep red that keeps strong contrast with white text in every sky. */
.danger {
  background: #b42318;
  color: #fff;
}

.danger:hover {
  background: #912018;
}

@keyframes appear {
  from {
    transform: scale(0.96);
    opacity: 0;
  }
}
</style>
