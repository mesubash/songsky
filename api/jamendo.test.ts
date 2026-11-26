import { afterEach, describe, expect, it, vi } from 'vitest';

async function load(key?: string) {
  vi.resetModules();
  if (key) process.env.JAMENDO_CLIENT_ID = key;
  else delete process.env.JAMENDO_CLIENT_ID;
  return import('./jamendo');
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.JAMENDO_CLIENT_ID;
});

describe('GET /api/jamendo', () => {
  it('says so when no key is set, without calling Jamendo', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const { GET } = await load();
    const response = await GET(new Request('https://songsky.test/api/jamendo?search=rain'));
    expect(response.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('adds the key on the server, keeps only safe options, and caches', async () => {
    const fetch = vi.fn(async () =>
      Response.json({ headers: { secret: 'x' }, results: [{ id: '1' }] }),
    );
    vi.stubGlobal('fetch', fetch);
    const { GET } = await load('test-key');
    const response = await GET(
      new Request(
        'https://songsky.test/api/jamendo?search=rain&tags=lounge&order=bad&limit=999&client_id=evil&callback=x',
      ),
    );
    const url = new URL(String(fetch.mock.calls[0]?.[0]));
    expect(url.origin + url.pathname).toBe('https://api.jamendo.com/v3.0/tracks/');
    expect(url.searchParams.get('client_id')).toBe('test-key');
    expect(url.searchParams.get('order')).toBe('popularity_week');
    expect(url.searchParams.get('limit')).toBe('50');
    expect(url.searchParams.has('callback')).toBe(false);
    expect(response.headers.get('cache-control')).toContain('s-maxage=3600');
    // Only the results go back to the browser.
    expect(await response.json()).toEqual({ results: [{ id: '1' }] });
  });

  it('retries once when Jamendo answers with nothing, and caches empty answers briefly', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ results: [] }))
      .mockResolvedValueOnce(Response.json({ results: [{ id: '2' }] }));
    vi.stubGlobal('fetch', fetch);
    const { GET } = await load('test-key');
    const response = await GET(new Request('https://songsky.test/api/jamendo?tags=lounge'));
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(await response.json()).toEqual({ results: [{ id: '2' }] });

    const empty = vi.fn(async () => Response.json({ results: [] }));
    vi.stubGlobal('fetch', empty);
    const none = await GET(new Request('https://songsky.test/api/jamendo?tags=lounge'));
    expect(none.headers.get('cache-control')).toBe('public, s-maxage=60');
  });

  it('looks songs up by id, and ignores ids that are not plain numbers', async () => {
    const fetch = vi.fn(async () => Response.json({ results: [{ id: '1' }] }));
    vi.stubGlobal('fetch', fetch);
    const { GET } = await load('test-key');
    await GET(new Request('https://songsky.test/api/jamendo?ids=12,345'));
    expect(new URL(String(fetch.mock.calls[0]?.[0])).searchParams.get('id')).toBe('12+345');
    await GET(new Request('https://songsky.test/api/jamendo?ids=12,abc'));
    expect(new URL(String(fetch.mock.calls[1]?.[0])).searchParams.has('id')).toBe(false);
  });

  it('drops tags with unexpected characters', async () => {
    const fetch = vi.fn(async () => Response.json({ results: [] }));
    vi.stubGlobal('fetch', fetch);
    const { GET } = await load('test-key');
    await GET(new Request('https://songsky.test/api/jamendo?tags=<script>'));
    expect(new URL(String(fetch.mock.calls[0]?.[0])).searchParams.has('tags')).toBe(false);
  });
});
