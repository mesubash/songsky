/** True inside the Android or iPhone app (Capacitor), false in a browser. */
export const isNative =
  (
    globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }
  ).Capacitor?.isNativePlatform?.() === true;

/** The app has no server of its own, so it calls the website's API. */
export const API_BASE = isNative ? 'https://songsky.subashsdhami.com.np' : '';
