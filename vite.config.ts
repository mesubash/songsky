/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const SKY = '#161a36';
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
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
  preview: { allowedHosts: ['.trycloudflare.com'] },
  resolve: {
    alias: { $lib: fileURLToPath(new URL('./src/lib', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
