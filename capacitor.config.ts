import type { CapacitorConfig } from '@capacitor/cli';

/** The Android and iPhone apps: the same Songsky, built with `pnpm build`, in a native shell. */
const config: CapacitorConfig = {
  appId: 'np.com.subashsdhami.songsky',
  appName: 'Songsky',
  webDir: 'dist',
  backgroundColor: '#161a36',
};

export default config;
