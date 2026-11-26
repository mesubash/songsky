<script lang="ts">
import { radio } from '$lib/radio/radio.svelte';
import Button from './Button.svelte';
import Icon from './Icon.svelte';

/** Takes the player bar's place while a radio station is on. */
</script>

{#if radio.station}
  {@const station = radio.station}
  <section class="bar" aria-label="Live radio">
    <div class="now">
      <span class="logo">
        {#if station.logo}
          <img
            src={station.logo}
            alt=""
            referrerpolicy="no-referrer"
            onerror={(e) => e.currentTarget.remove()}
          >
        {/if}
        <Icon name="disc" size={20} />
      </span>
      <span class="text">
        <span class="title">{station.name}</span>
        <span class="sub"
          ><span class="live" class:on={radio.playing}>Live</span>{station.country
            ? ` ${station.country}`
            : ''}</span
        >
      </span>
    </div>

    <div class="center">
      <Button
        variant="icon"
        icon={radio.playing ? 'pause' : 'play'}
        iconSize={24}
        aria-label={radio.playing ? 'Pause radio' : 'Play radio'}
        disabled={radio.loading && !radio.playing}
        onclick={() => radio.toggle()}
      />
      {#if radio.loading}
        <span class="status">Tuning in…</span>
      {:else if radio.error}
        <span class="status">{radio.error}</span>
      {/if}
    </div>

    <div class="side">
      {#if station.homepage}
        <a class="site" href={station.homepage} target="_blank" rel="noopener noreferrer"
          >Station site <Icon name="external" size={14} /></a
        >
      {/if}
      <Button
        variant="icon"
        icon="close"
        iconSize={18}
        aria-label="Stop radio"
        onclick={() => radio.stop()}
      />
    </div>
  </section>
{/if}

<style>
.bar {
  position: fixed;
  inset: auto 0 var(--tabbar);
  z-index: 10;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: var(--space-6);
  padding-block: var(--space-3);
  padding-inline: max(var(--gutter), calc((100% - var(--content-max)) / 2));
  padding-bottom: max(var(--space-3), env(safe-area-inset-bottom));
  border-top: 1px solid var(--line);
  background: color-mix(in srgb, var(--sky-top) 78%, transparent);
  backdrop-filter: blur(24px) saturate(1.4);
}

.now {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.logo {
  position: relative;
  display: grid;
  flex: none;
  place-items: center;
  width: 52px;
  height: 52px;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--surface-strong);
  color: var(--text-muted);
}

.logo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #fff;
}

.text {
  display: grid;
  min-width: 0;
}

.title {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub,
.status {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

/* "Live" with a dot that glows while the station is playing. */
.live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
}

.live::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
}

.live.on::before {
  background: #e5484d;
  box-shadow: 0 0 0 3px rgb(229 72 77 / 0.25);
  animation: pulse 1.6s ease-in-out infinite;
}

.center {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.center > :global(.button) {
  width: 52px;
  height: 52px;
  background: var(--text);
  color: var(--sky-top);
}

.side {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
}

.site {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--text);
  font-size: var(--text-sm);
  font-weight: 600;
}

@media (max-width: 720px) {
  .bar {
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: var(--space-3);
    padding-block: var(--space-2);
  }

  .site,
  .status {
    display: none;
  }
}

@keyframes pulse {
  50% {
    box-shadow: 0 0 0 6px rgb(229 72 77 / 0);
  }
}
</style>
