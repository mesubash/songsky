import { registerSW } from 'virtual:pwa-register';
import { toast } from '$lib/toast.svelte';

/** The install prompt Chromium browsers offer; not in TypeScript's DOM types yet. */
interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Service worker state: offline support, updates, and installing as an app. */
class Pwa {
  updateReady = $state(false);
  /** The browser will let us show its install prompt. */
  canInstall = $state(false);
  /** Running as an installed app (its own window, no browser bar). */
  installed = $state(
    matchMedia('(display-mode: standalone)').matches ||
      // iPhone and iPad report the installed app this way instead.
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  );
  checking = $state(false);
  #applyUpdate: ((reload?: boolean) => Promise<void>) | undefined;
  #registration: ServiceWorkerRegistration | undefined;
  #installPrompt: InstallPrompt | null = null;

  start(): void {
    this.#applyUpdate = registerSW({
      onNeedRefresh: () => {
        this.updateReady = true;
      },
      onOfflineReady: () => {
        toast.show('Songsky is ready to use offline.');
      },
      onRegisteredSW: (_url, registration) => {
        this.#registration = registration;
      },
    });
    addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.#installPrompt = event as InstallPrompt;
      this.canInstall = true;
    });
    addEventListener('appinstalled', () => {
      this.installed = true;
      this.canInstall = false;
    });
  }

  async install(): Promise<void> {
    if (!this.#installPrompt) return;
    await this.#installPrompt.prompt();
    const { outcome } = await this.#installPrompt.userChoice;
    this.#installPrompt = null;
    this.canInstall = false;
    if (outcome === 'accepted') toast.show('Songsky is installed.');
  }

  /** Asks the server for a newer version. If one exists, the update prompt appears. */
  async checkForUpdates(): Promise<void> {
    if (!this.#registration) {
      toast.show('Updates are checked when Songsky runs from its website.');
      return;
    }
    this.checking = true;
    try {
      await this.#registration.update();
      // A found update installs in the background, then onNeedRefresh shows the prompt.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (!this.updateReady && !this.#registration.installing && !this.#registration.waiting) {
        toast.show(`You have the latest version (${__APP_VERSION__}).`);
      }
    } catch {
      toast.show('Couldn’t check for updates. Check your connection.');
    } finally {
      this.checking = false;
    }
  }

  update(): void {
    void this.#applyUpdate?.(true);
  }

  dismiss(): void {
    this.updateReady = false;
  }
}

export const pwa = new Pwa();
