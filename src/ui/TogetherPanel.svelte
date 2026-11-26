<script lang="ts">
import { library } from '$lib/library/library.svelte';
import { toast } from '$lib/toast.svelte';
import { MAX_CHAT_LENGTH, MAX_NAME_LENGTH, searchCatalog } from '$lib/together/sync';
import { together } from '$lib/together/together.svelte';
import Button from './Button.svelte';
import { modal } from './modal';

let { open = $bindable(false) }: { open?: boolean } = $props();

let draft = $state('');
let query = $state('');
const results = $derived(searchCatalog(together.catalog, query));
let busy = $state(false);
let chatList = $state<HTMLOListElement>();

const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

async function run(action: () => Promise<void>) {
  busy = true;
  try {
    await action();
  } catch {
    together.error = 'Couldn’t connect. Check your network and try again.';
  } finally {
    busy = false;
  }
}

async function copyLink() {
  if (!together.link) return;
  await navigator.clipboard.writeText(together.link);
  toast.show('Link copied. Send it to a friend.');
}

async function shareLink() {
  if (!together.link) return;
  await navigator.share({ title: 'Listen with me on Songsky', url: together.link }).catch(() => {});
}

async function send(event: SubmitEvent) {
  event.preventDefault();
  const text = draft.trim();
  if (!text) return;
  draft = '';
  await together.sendChat(text);
}

// Keep the newest message in view.
$effect(() => {
  if (together.messages.length && chatList) chatList.scrollTop = chatList.scrollHeight;
});

function closeOnBackdrop(event: MouseEvent) {
  if (event.target === event.currentTarget) open = false;
}
</script>

<!-- biome-ignore lint/a11y/useKeyWithClickEvents: Escape already closes the native dialog; this only handles backdrop clicks. -->
<dialog
  class="panel"
  use:modal={open}
  aria-labelledby="together-title"
  onclose={() => (open = false)}
  onclick={closeOnBackdrop}
>
  <div class="content">
    <header>
      <h2 id="together-title">Listen together</h2>
      <Button variant="icon" icon="close" aria-label="Close" onclick={() => (open = false)} />
    </header>

    {#if together.role === null}
      <p class="lead">
        {together.invite
          ? 'You’re invited to listen along. Songs play in sync with the person who sent the link.'
          : 'Share a link and friends hear what you’re playing, in sync, with a chat on the side.'}
      </p>
      <label class="field">
        <span>Your name</span>
        <input
          value={together.name}
          maxlength={MAX_NAME_LENGTH}
          placeholder="Listener"
          autocomplete="nickname"
          oninput={(e) => together.setName(e.currentTarget.value)}
        >
      </label>
      {#if together.invite}
        <Button
          variant="primary"
          icon="users"
          disabled={busy}
          onclick={() => run(() => together.join())}
        >
          Join
        </Button>
      {:else}
        <Button
          variant="primary"
          icon="users"
          disabled={busy || library.tracks.length === 0}
          onclick={() => run(() => together.host())}
        >
          Start a session
        </Button>
      {/if}
      <p class="hint">
        Songs travel straight from the host’s device to each listener. Nothing is uploaded to a
        server.
      </p>
    {:else}
      {#if together.role === 'host'}
        <div class="share">
          <input class="link" readonly value={together.link ?? ''} aria-label="Session link">
          <Button icon="copy" onclick={copyLink}>Copy</Button>
          {#if canShare}
            <Button icon="share" onclick={shareLink}>Share</Button>
          {/if}
        </div>
        <p class="status">
          {together.listeners === 0
            ? 'Waiting for friends to join…'
            : `${together.listeners} ${together.listeners === 1 ? 'person is' : 'people are'} listening.`}
        </p>
      {:else}
        <div class="now">
          {#if together.song}
            <strong>{together.song.title}</strong>
            <span class="muted">{together.song.artist}</span>
            {#if together.receiving !== null}
              <progress
                max="1"
                value={together.receiving}
                aria-label="Receiving the song"
              ></progress>
            {/if}
          {:else}
            <span class="muted">Connecting to the host…</span>
          {/if}
        </div>
        {#if together.error}
          <Button variant="primary" icon="play" onclick={() => together.resume()}
            >Start listening</Button
          >
        {/if}
      {/if}

      <section class="requests" aria-labelledby="requests-title">
        <h3 id="requests-title">Requests</h3>
        {#if together.role === 'guest'}
          <input
            type="search"
            bind:value={query}
            placeholder="Find a song to request"
            aria-label="Find a song to request"
          >
          {#if results.length}
            <ul class="results">
              {#each results as song (song.key)}
                <li>
                  <button
                    type="button"
                    onclick={() => {
                      void together.requestSong(song);
                      query = '';
                      toast.show(`Requested “${song.title}”.`);
                    }}
                  >
                    <span>{song.title}</span>
                    <span class="muted">{song.artist}</span>
                  </button>
                </li>
              {/each}
            </ul>
          {:else if query.trim()}
            <p class="muted">No songs match.</p>
          {/if}
        {/if}

        {#if together.requests.length}
          <ol class="queue">
            {#each together.requests as request, i (request.key)}
              <li>
                <span class="song">
                  <span>{request.title}</span>
                  <span class="muted">{i === 0 ? 'Plays next' : request.artist}</span>
                </span>
                <button
                  class="vote"
                  type="button"
                  aria-label="Vote for {request.title}, {request.votes.length} {request.votes
                    .length === 1
                    ? 'vote'
                    : 'votes'}"
                  onclick={() => together.requestSong(request)}
                >
                  +{request.votes.length}
                </button>
              </li>
            {/each}
          </ol>
        {:else}
          <p class="muted">
            {together.role === 'host'
              ? 'Listeners can request songs from your library. The most wanted one plays next.'
              : 'Request a song and vote for others. The most wanted one plays next.'}
          </p>
        {/if}
      </section>

      <ol class="chat" bind:this={chatList} aria-label="Chat" aria-live="polite">
        {#each together.messages as message (message.at + message.name)}
          <li><strong>{message.name}</strong> {message.text}</li>
        {:else}
          <li class="muted">No messages yet.</li>
        {/each}
      </ol>
      <form class="send" onsubmit={send}>
        <input
          bind:value={draft}
          maxlength={MAX_CHAT_LENGTH}
          placeholder="Say something"
          aria-label="Message"
          enterkeyhint="send"
        >
        <Button variant="icon" icon="send" type="submit" aria-label="Send" />
      </form>

      <button class="link-button" type="button" onclick={() => together.leave()}>
        {together.role === 'host' ? 'End session' : 'Leave'}
      </button>
    {/if}

    {#if together.error && together.role !== 'guest'}
      <p class="error">{together.error}</p>
    {/if}
  </div>
</dialog>

<style>
.panel {
  width: min(100% - 2rem, 28rem);
  max-height: calc(100dvh - 2rem);
  margin: auto; /* The global reset removes the dialog's default centering. */
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--sky-top) 92%, var(--text));
  color: var(--text);
}

.panel::backdrop {
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

.lead,
.status,
.muted,
.hint {
  color: var(--text-muted);
}

.hint {
  font-size: var(--text-sm);
}

.field {
  display: grid;
  gap: var(--space-2);
  font-weight: 600;
}

input {
  min-width: 0;
  min-height: 44px;
  padding: 0 var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--surface);
  font-weight: 400;
}

input::placeholder {
  color: var(--text-muted);
}

.share,
.send {
  display: flex;
  gap: var(--space-2);
}

.share .link,
.send input {
  flex: 1;
}

.now {
  display: grid;
  gap: var(--space-1);
}

progress {
  width: 100%;
  height: 4px;
  accent-color: var(--accent);
}

.chat {
  display: grid;
  align-content: start;
  gap: var(--space-2);
  height: 9rem;
  margin: 0;
  padding: var(--space-3);
  overflow-y: auto;
  border-radius: var(--radius-md);
  background: var(--surface);
  list-style: none;
  overflow-wrap: anywhere;
}

.requests {
  display: grid;
  gap: var(--space-2);
}

h3 {
  font-size: var(--text-base);
}

.results,
.queue {
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  max-height: 12rem;
  overflow-y: auto;
  list-style: none;
}

.results button {
  display: grid;
  width: 100%;
  min-height: 44px;
  padding: var(--space-2) var(--space-3);
  border: 0;
  border-radius: var(--radius-md);
  background: none;
  text-align: start;
}

.results button:hover {
  background: var(--surface);
}

.queue li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.song {
  display: grid;
  min-width: 0;
}

.song span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vote {
  flex: none;
  min-width: 44px;
  min-height: 36px;
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: none;
  font-variant-numeric: tabular-nums;
}

.vote:hover {
  background: var(--surface);
}

.link-button {
  justify-self: start;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--text-muted);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.error {
  color: #ffb4a3;
  font-size: var(--text-sm);
}
</style>
