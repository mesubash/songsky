/**
 * Security headers for every page. vercel.json (production) must match these; a test in
 * config/security-headers.test.ts checks that, and `pnpm preview` sends the same ones so
 * they can be tried locally.
 *
 * The Content Security Policy allows only what Songsky uses:
 * - scripts, styles and fonts from this site (inline styles for Svelte's style: bindings);
 * - images and audio from any https host (song covers and streams come from many servers);
 * - connections over https and wss (music APIs, weather, map tiles, Listen together relays);
 * - workers from this site or blob: (tempo analysis);
 * and it refuses to be framed by other sites. (No upgrade-insecure-requests: the site is
 * https-only through HSTS anyway, and Safari applies that rule to http://localhost too, which
 * breaks `pnpm preview` there.)
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https: wss:",
  "font-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy':
    'geolocation=(self), accelerometer=(self), gyroscope=(self), camera=(), microphone=(), payment=()',
};
