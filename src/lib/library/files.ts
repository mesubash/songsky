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

export const canPickFolder = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

/** Opens the native file picker. Resolves with [] if the user cancels. */
export function pickFiles(): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'audio/*';
    input.addEventListener('change', () => resolve([...(input.files ?? [])]));
    input.addEventListener('cancel', () => resolve([]));
    input.click();
  });
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
