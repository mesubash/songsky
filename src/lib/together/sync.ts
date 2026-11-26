/** Pure pieces of Listen together: links, message checks and playback sync maths. */

/** What the host broadcasts about playback. Times are the host's clock, in ms. */
export interface NowPlaying {
  key: string;
  playing: boolean;
  /** Seconds into the song at `at`. */
  position: number;
  at: number;
}

export interface ChatMessage {
  name: string;
  text: string;
  at: number;
}

export const MAX_CHAT_LENGTH = 300;
export const MAX_NAME_LENGTH = 40;
/** Guests re-seek when they drift further than this from the host. */
export const DRIFT_TOLERANCE = 0.3;

const ID_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';

export function randomId(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join('');
}

export interface SessionKey {
  room: string;
  password: string;
}

export function sessionLink(base: string, session: SessionKey): string {
  const url = new URL(base);
  url.hash = '';
  url.search = '';
  url.searchParams.set('room', session.room);
  url.searchParams.set('key', session.password);
  return url.toString();
}

/** Reads a session from a link, or null if it isn't a valid invite. */
export function parseSession(href: string): SessionKey | null {
  const params = new URL(href).searchParams;
  const room = params.get('room');
  const password = params.get('key');
  const valid = (value: string | null, length: number): value is string =>
    !!value && value.length === length && [...value].every((c) => ID_ALPHABET.includes(c));
  return valid(room, 10) && valid(password, 20) ? { room, password } : null;
}

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Messages come from other people's devices, so they are checked before use. */
export function readNowPlaying(data: unknown): NowPlaying | null {
  if (typeof data !== 'object' || data === null) return null;
  const { key, playing, position, at } = data as Record<string, unknown>;
  if (typeof key !== 'string' || key.length > 200 || typeof playing !== 'boolean') return null;
  if (!isFiniteNumber(position) || position < 0 || !isFiniteNumber(at)) return null;
  return { key, playing, position, at };
}

export function readChat(data: unknown): ChatMessage | null {
  if (typeof data !== 'object' || data === null) return null;
  const { name, text, at } = data as Record<string, unknown>;
  if (typeof name !== 'string' || typeof text !== 'string' || !isFiniteNumber(at)) return null;
  const clean = (value: string, max: number) => value.trim().slice(0, max);
  const message = {
    name: clean(name, MAX_NAME_LENGTH) || 'Listener',
    text: clean(text, MAX_CHAT_LENGTH),
    at,
  };
  return message.text ? message : null;
}

/**
 * Host clock minus local clock, from round trips: each sample is when we asked (sent),
 * what the host's clock said, and when the answer arrived. The fastest round trip is
 * the most accurate.
 */
export function clockOffset(samples: { sent: number; host: number; received: number }[]): number {
  const best = samples.reduce((a, b) => (b.received - b.sent < a.received - a.sent ? b : a));
  return best.host - (best.sent + best.received) / 2;
}

/** Where a guest should be in the song right now, in seconds. */
export function targetPosition(state: NowPlaying, localNow: number, offset: number): number {
  if (!state.playing) return state.position;
  return state.position + (localNow + offset - state.at) / 1000;
}

export function needsSeek(current: number, target: number): boolean {
  return Math.abs(current - target) > DRIFT_TOLERANCE;
}
