/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const SKY = '#161a36';
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

/**
 * Local stand-in for api/jamendo.ts: `pnpm dev` and `pnpm preview` pass /api/jamendo on to
 * Jamendo with the key from .env.local. The key is read here, on your machine, and never
 * bundled (it has no VITE_ prefix). Without a key the route doesn't exist, as on Vercel.
 */
function jamendoProxy(key: string | undefined): Record<string, ProxyOptions> {
  if (!key) return {};
  return {
    '/api/jamendo': {
      target: 'https://api.jamendo.com',
      changeOrigin: true,
      rewrite: (path) => {
        const params = new URL(path, 'http://local').searchParams;
        params.set('client_id', key);
        params.set('format', 'json');
        params.set('audioformat', 'mp32');
        params.set('imagesize', '300');
        params.set('include', 'musicinfo');
        return `/v3.0/tracks/?${params}`;
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const { JAMENDO_CLIENT_ID } = loadEnv(mode, process.cwd(), '');
  const proxy = jamendoProxy(JAMENDO_CLIENT_ID);
  return {
    // Shown on Settings > About.
    define: {
      __APP_VERSION__: JSON.stringify(version),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
    },
    plugins: [
      svelte(),
      VitePWA({
        // Ask before updating: a silent reload would cut off the song that's playing.
        registerType: 'prompt',
        pwaAssets: { config: true },
        manifest: {
          id: '/',
          name: 'Songsky – Music Player',
          short_name: 'Songsky',
          description:
            'A free music player for the songs on your device. Works offline and follows your weather, mood and pace.',
          theme_color: SKY,
          background_color: SKY,
          display: 'standalone',
          categories: ['music', 'entertainment'],
        },
        workbox: {
          // App shell, lazy chunks and fonts are all cached so Songsky opens offline.
          globPatterns: ['**/*.{js,css,html,woff2,svg,png,ico}'],
          // The social preview is for link previews, not for using the app offline.
          globIgnores: ['og-image.png'],
        },
      }),
    ],
    // Lets a temporary Cloudflare tunnel reach `pnpm preview` for testing on a phone over HTTPS.
    preview: { allowedHosts: ['.trycloudflare.com'], proxy },
    server: { proxy },
    resolve: {
      alias: { $lib: fileURLToPath(new URL('./src/lib', import.meta.url)) },
    },
    test: {
      include: ['src/**/*.test.ts', 'api/**/*.test.ts'],
    },
  };
});
