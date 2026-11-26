export type RepeatMode = 'off' | 'all' | 'one';

export const REPEAT_ORDER: readonly RepeatMode[] = ['off', 'all', 'one'];

/** Fisher–Yates shuffle that keeps `firstId` at the front, so the playing song stays put. */
export function shuffledWithFirst(
  ids: readonly string[],
  firstId: string | undefined,
  random: () => number = Math.random,
): string[] {
  const rest = ids.filter((id) => id !== firstId);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rest[i], rest[j]] = [rest[j] as string, rest[i] as string];
  }
  return firstId !== undefined && ids.includes(firstId) ? [firstId, ...rest] : rest;
}

/**
 * Index to play after `index`, or null when playback should stop.
 * `auto` is true when a song ended by itself; only then does repeat-one replay it.
 */
export function nextIndex(
  length: number,
  index: number,
  repeat: RepeatMode,
  auto: boolean,
): number | null {
  if (length === 0) return null;
  if (auto && repeat === 'one') return index;
  if (index + 1 < length) return index + 1;
  return repeat === 'off' ? null : 0;
}

/** Index to play before `index`, or null to restart the current song. */
export function prevIndex(length: number, index: number, repeat: RepeatMode): number | null {
  if (length === 0) return null;
  if (index > 0) return index - 1;
  return repeat === 'off' ? null : length - 1;
}

/** Places `id` right after the current song, moving it if it's already queued. */
export function moveToNext(
  queue: readonly string[],
  index: number,
  id: string,
): { queue: string[]; index: number } {
  const current = queue[index];
  const rest = queue.filter((queued) => queued !== id || queued === current);
  const at = current === undefined ? -1 : rest.indexOf(current);
  if (current !== id) rest.splice(at + 1, 0, id);
  return { queue: rest, index: at };
}

/** Adds a song to the end of the queue (moving it there if it was already coming up). */
export function addToEnd(
  queue: readonly string[],
  index: number,
  id: string,
): { queue: string[]; index: number } {
  const current = queue[index];
  if (current === id) return { queue: [...queue], index };
  const rest = queue.filter((queued) => queued !== id);
  return { queue: [...rest, id], index: current === undefined ? -1 : rest.indexOf(current) };
}

/** Removes the song at `at`. The playing song can't be removed this way. */
export function removeAt(
  queue: readonly string[],
  index: number,
  at: number,
): { queue: string[]; index: number } {
  if (at === index || at < 0 || at >= queue.length) return { queue: [...queue], index };
  const next = queue.filter((_, i) => i !== at);
  return { queue: next, index: at < index ? index - 1 : index };
}

/** Moves the song at `from` to position `to`, keeping track of the playing song. */
export function moveTo(
  queue: readonly string[],
  index: number,
  from: number,
  to: number,
): { queue: string[]; index: number } {
  if (from === to || from < 0 || to < 0 || from >= queue.length || to >= queue.length) {
    return { queue: [...queue], index };
  }
  const current = queue[index];
  const next = [...queue];
  const [moved] = next.splice(from, 1);
  if (moved !== undefined) next.splice(to, 0, moved);
  return { queue: next, index: current === undefined ? index : next.indexOf(current) };
}
