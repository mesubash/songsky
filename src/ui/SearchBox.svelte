<script lang="ts">
import { discover } from '$lib/discover/discover.svelte';
import Button from './Button.svelte';

/** Search Audius from anywhere. Results show in Discover. */
let { id }: { id: string } = $props();

function submit(event: SubmitEvent) {
  event.preventDefault();
  if (location.hash !== '#discover') location.hash = '#discover';
  void discover.search(discover.query);
}
</script>

<search class="search">
  <form onsubmit={submit}>
    <label class="visually-hidden" for={id}>Search songs and artists</label>
    <input
      {id}
      type="search"
      bind:value={discover.query}
      placeholder="Search songs and artists"
      enterkeyhint="search"
      autocomplete="off"
      oninput={() => {
        if (!discover.query.trim()) void discover.search('');
      }}
    >
    <Button
      variant="icon"
      icon="search"
      type="submit"
      aria-label="Search"
      disabled={discover.searching}
    />
  </form>
</search>

<style>
.search {
  width: min(100%, 26rem);
}

form {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding-left: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--surface);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

form:focus-within {
  border-color: var(--text-muted);
  background: var(--surface-strong);
}

input {
  flex: 1;
  min-width: 0;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
}

input:focus {
  outline: none;
}

input::placeholder {
  color: var(--text-muted);
}
</style>
