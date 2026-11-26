export interface ConfirmRequest {
  title: string;
  message: string;
  /** The button that does it, e.g. "Delete playlist". */
  action: string;
  /** Red for actions that delete; calm for ones that don't (e.g. restoring a backup). */
  tone?: 'danger' | 'calm';
}

/** An in-app "are you sure?" that matches Songsky, instead of the browser's own popup.
    `await ask({...})` resolves true only if the person chose the action. */
class Confirm {
  request = $state<ConfirmRequest | null>(null);
  #resolve: ((ok: boolean) => void) | null = null;

  ask(request: ConfirmRequest): Promise<boolean> {
    this.#resolve?.(false);
    this.request = request;
    return new Promise((resolve) => {
      this.#resolve = resolve;
    });
  }

  answer(ok: boolean): void {
    this.#resolve?.(ok);
    this.#resolve = null;
    this.request = null;
  }
}

export const confirmation = new Confirm();
export const ask = (request: ConfirmRequest) => confirmation.ask(request);
