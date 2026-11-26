/** Seconds of fade at the end of the last song before sleep. */
export const FADE_SECONDS = 30;

/** Volume multiplier for the last song: 1 until the final stretch, then down to 0. */
export function fadeFactor(remaining: number, fadeSeconds = FADE_SECONDS): number {
  if (!Number.isFinite(remaining) || remaining >= fadeSeconds) return 1;
  return Math.max(0, remaining / fadeSeconds);
}

/** "12 min", "1 h 5 min", or "under a minute". */
export function formatRemaining(ms: number): string {
  const minutes = Math.ceil(ms / 60_000);
  if (ms < 60_000) return 'under a minute';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}
