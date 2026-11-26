/** A short message shown above the player bar, e.g. "Added 12 songs." */
class Toast {
  message = $state<string | null>(null);

  show(message: string): void {
    this.message = message;
  }

  clear(): void {
    this.message = null;
  }
}

export const toast = new Toast();
