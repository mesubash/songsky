import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Generates the app icons from public/icon.svg. Run `pnpm icons` after changing the logo.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0 },
    apple: { ...minimal2023Preset.apple, padding: 0 },
  },
  images: ['public/icon.svg'],
});
