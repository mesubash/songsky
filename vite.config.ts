/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const SKY = '#161a36';

export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      // Ask before updating: a silent reload would cut off the song that's playing.
      registerType: 'prompt',
      pwaAssets: { config: true },
      manifest: {
        id: '/',
        name: 'Attune – Music Player',
        short_name: 'Attune',
        description:
          'A music player in tune with your life. Plays your own files and adapts to your weather, mood and pace.',
        theme_color: SKY,
        background_color: SKY,
        display: 'standalone',
        categories: ['music', 'entertainment'],
      },
      workbox: {
        // App shell, lazy chunks and fonts are all cached so Attune opens offline.
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,ico}'],
      },
    }),
  ],
  resolve: {
    alias: { $lib: fileURLToPath(new URL('./src/lib', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
