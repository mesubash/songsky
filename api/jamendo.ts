/**
 * GET /api/jamendo: searches Jamendo's free Creative Commons catalogue on Songsky's behalf.
 *
 * The Jamendo key stays on the server (the JAMENDO_CLIENT_ID environment variable on
 * Vercel), so it never ships in the app's JavaScript. Only track searches with a few
 * checked options are passed on, so this can't be used as an open relay, and results
 * are cached for an hour at Vercel's edge to spare the monthly request limit.
 */

const ORDERS = new Set([
  'popularity_week',
  'popularity_month',
  'popularity_total',
  'releasedate_desc',
]);
const TAG = /^[a-z0-9+ -]{1,60}$/i;

// Typed locally so this file needs no Node type package.
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env;

function json(body: unknown, status: number, cache: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': cache },
  });
}

const clampInt = (value: string | null, min: number, max: number, fallback: number) => {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback;
};

export async function GET(request: Request): Promise<Response> {
  const key = env?.JAMENDO_CLIENT_ID;
  if (!key) return json({ error: 'not-configured' }, 503, 'no-store');

  const incoming = new URL(request.url).searchParams;
  const params = new URLSearchParams({
    client_id: key,
    format: 'json',
    audioformat: 'mp32',
    imagesize: '300',
    include: 'musicinfo',
    limit: String(clampInt(incoming.get('limit'), 1, 50, 30)),
    offset: String(clampInt(incoming.get('offset'), 0, 1000, 0)),
  });
  const search = incoming.get('search')?.trim().slice(0, 100);
  if (search) params.set('search', search);
  const tags = incoming.get('tags')?.trim();
  if (tags && TAG.test(tags)) params.set('tags', tags);
  const order = incoming.get('order');
  params.set('order', order && ORDERS.has(order) ? order : 'popularity_week');

  try {
    const upstream = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params}`);
    if (!upstream.ok) return json({ error: 'upstream' }, 502, 'no-store');
    const body = (await upstream.json()) as { results?: unknown };
    return json(
      { results: Array.isArray(body.results) ? body.results : [] },
      200,
      'public, s-maxage=3600, stale-while-revalidate=86400',
    );
  } catch {
    return json({ error: 'upstream' }, 502, 'no-store');
  }
}
