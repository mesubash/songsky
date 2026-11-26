import { registerSW } from 'virtual:pwa-register';
import { toast } from '$lib/toast.svelte';

/** Service worker state: offline support and the "new version" prompt. */
class Pwa {
  updateReady = $state(false);
  #applyUpdate: ((reload?: boolean) => Promise<void>) | undefined;

  start(): void {
    this.#applyUpdate = registerSW({
      onNeedRefresh: () => {
        this.updateReady = true;
      },
      onOfflineReady: () => {
        toast.show('Attune is ready to use offline.');
      },
    });
  }

  update(): void {
    void this.#applyUpdate?.(true);
  }

  dismiss(): void {
    this.updateReady = false;
  }
}

export const pwa = new Pwa();
