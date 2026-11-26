export type ShortcutAction =
  | 'toggle'
  | 'next'
  | 'prev'
  | 'seek-forward'
  | 'seek-back'
  | 'volume-up'
  | 'volume-down'
  | 'mute'
  | 'shuffle'
  | 'repeat'
  | 'like'
  | 'player'
  | 'queue'
  | 'search'
  | 'help';

/** Shown in the shortcuts list, in this order. */
export const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['Space', 'K'], label: 'Play or pause' },
  { keys: ['Shift', '→'], label: 'Next song' },
  { keys: ['Shift', '←'], label: 'Previous song' },
  { keys: ['→'], label: 'Forward 5 seconds' },
  { keys: ['←'], label: 'Back 5 seconds' },
  { keys: ['Shift', '↑'], label: 'Volume up' },
  { keys: ['Shift', '↓'], label: 'Volume down' },
  { keys: ['M'], label: 'Mute or unmute' },
  { keys: ['S'], label: 'Shuffle on or off' },
  { keys: ['R'], label: 'Change repeat' },
  { keys: ['L'], label: 'Save or remove the playing song' },
  { keys: ['F'], label: 'Open or close the full-screen player' },
  { keys: ['Q'], label: 'Open or close the queue' },
  { keys: ['/'], label: 'Search (your library on the Library page)' },
  { keys: ['?'], label: 'Show these shortcuts' },
];

/** The action for a key press, or null. Ctrl, Cmd and Alt are left to the browser. */
export function shortcutFor(
  event: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'altKey'>,
): ShortcutAction | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (event.shiftKey) {
    switch (key) {
      case 'ArrowRight':
        return 'next';
      case 'ArrowLeft':
        return 'prev';
      case 'ArrowUp':
        return 'volume-up';
      case 'ArrowDown':
        return 'volume-down';
      case '?':
        return 'help';
      default:
        return null;
    }
  }
  const plain: Record<string, ShortcutAction> = {
    ' ': 'toggle',
    k: 'toggle',
    ArrowRight: 'seek-forward',
    ArrowLeft: 'seek-back',
    m: 'mute',
    s: 'shuffle',
    r: 'repeat',
    l: 'like',
    f: 'player',
    q: 'queue',
    '/': 'search',
    '?': 'help',
  };
  return plain[key] ?? null;
}

/** Typing in a field, or a focused control that uses these keys itself. */
export function isOwnKeys(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName);
}
