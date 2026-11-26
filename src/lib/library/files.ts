import { isIOS } from '$lib/platform';

const AUDIO_EXTENSION = /\.(mp3|m4a|aac|flac|wav|ogg|oga|opus|webm|weba)$/i;

export function isAudioFile(name: string): boolean {
  return AUDIO_EXTENSION.test(name);
}

/** Stable id from file identity, so adding the same file twice is a no-op. */
export function trackIdFor(file: Pick<File, 'name' | 'size' | 'lastModified'>): string {
  return `${file.name}|${file.size}|${file.lastModified}`;
}

/** "02_my-song.mp3" → "02 my-song", used when a file has no title tag. */
export function titleFromFileName(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, '')
      .replace(/_+/g, ' ')
      .trim() || name
  );
}

export async function* walkDirectory(
  dir: FileSystemDirectoryHandle,
): AsyncGenerator<FileSystemFileHandle> {
  for await (const entry of dir.values()) {
    if (entry.kind === 'file' && isAudioFile(entry.name)) yield entry;
    else if (entry.kind === 'directory') yield* walkDirectory(entry);
  }
}

/** The browser can keep a folder connected and read it again later (Chrome, Edge). */
export const canPickFolder = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

/** The browser can at least pick a whole folder once (most desktop browsers; not iOS). */
export const canChooseFolder =
  canPickFolder ||
  (typeof document !== 'undefined' &&
    'webkitdirectory' in document.createElement('input') &&
    !isIOS());

/**
 * Picks a folder with the standard file input, for browsers without folder access (Brave,
 * Firefox, Safari). Returns its audio files and the folder's name; the songs are copied in.
 */
export function pickFolderFiles(): Promise<{ name: string; files: File[] }> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.addEventListener('change', () => {
      const files = [...(input.files ?? [])];
      const name = files[0]?.webkitRelativePath.split('/')[0] ?? '';
      resolve({ name, files: files.filter((f) => isAudioFile(f.name)) });
    });
    input.addEventListener('cancel', () => resolve({ name: '', files: [] }));
    input.click();
  });
}

/** Opens the native file picker. Resolves with [] if the user cancels. */
export function pickFiles(): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    // iOS greys out .mp3 and other audio files when `accept` is set, so let it show
    // everything there; non-audio picks are filtered out after.
    if (!isIOS()) input.accept = 'audio/*';
    input.addEventListener('change', () => resolve([...(input.files ?? [])]));
    input.addEventListener('cancel', () => resolve([]));
    input.click();
  });
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
