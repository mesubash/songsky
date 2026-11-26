import { library } from '$lib/library/library.svelte';

/** Pause between songs so analysis never hogs the device. */
const REST_MS = 400;

/**
 * Works through unanalysed songs one at a time, in the background. The analysis code
 * (decoder, beat detector) loads only when there is something to analyse.
 */
class Analyzer {
  progress = $state<{ done: number; total: number } | null>(null);
  #running = false;

  start(): void {
    $effect.root(() => {
      $effect(() => {
        if (library.tracks.some((t) => !t.analyzedAt)) void this.#run();
      });
    });
  }

  async #run(): Promise<void> {
    if (this.#running) return;
    this.#running = true;
    try {
      const { analyzeFile } = await import('./analyze');
      // Loop until nothing new arrived while we were busy.
      for (;;) {
        const pending = library.tracks.filter((t) => !t.analyzedAt && library.isAvailable(t));
        if (pending.length === 0) break;
        this.progress = { done: 0, total: pending.length };
        let progressed = false;
        for (const track of pending) {
          // Skips folder songs until access is granted again (needs a tap on play).
          const file = await library.fileFor(track);
          if (file) {
            const result = await analyzeFile(file).catch(() => ({}));
            await library.setAnalysis(track.id, result);
            progressed = true;
          }
          this.progress.done++;
          await new Promise((resolve) => setTimeout(resolve, REST_MS));
        }
        if (!progressed) break;
      }
    } finally {
      this.progress = null;
      this.#running = false;
    }
  }
}

export const analyzer = new Analyzer();
