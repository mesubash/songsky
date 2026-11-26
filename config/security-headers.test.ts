import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SECURITY_HEADERS } from './security-headers';

describe('vercel.json security headers', () => {
  it('match the ones the local preview sends', () => {
    const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as {
      headers: { source: string; headers: { key: string; value: string }[] }[];
    };
    const all = vercel.headers.find((rule) => rule.source === '/(.*)');
    const sent = Object.fromEntries(all?.headers.map((h) => [h.key, h.value]) ?? []);
    expect(sent).toEqual(SECURITY_HEADERS);
  });
});
