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
