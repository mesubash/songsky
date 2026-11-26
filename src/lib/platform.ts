/** iPhone and iPad, including iPads that report themselves as Macs. */
export function isIOS(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
  );
}

/**
 * How to install Songsky on this device when the browser has no install prompt of its own
 * (Safari on iPhone, iPad and Mac never offer one to websites). Null when there's nothing
 * to explain.
 */
export function installSteps(ua = navigator.userAgent): string[] | null {
  if (isIOS()) {
    return [
      'Open Songsky in Safari (on iOS 16.4 or later, Chrome and Edge work too).',
      'Tap the Share button, the square with an arrow pointing up.',
      'Scroll down and tap Add to Home Screen, then Add.',
    ];
  }
  if (/Android/i.test(ua)) {
    return [
      'Open the browser menu (⋮ in the top corner).',
      'Tap Install app or Add to Home screen.',
    ];
  }
  if (/Firefox\//.test(ua)) {
    return [
      'Firefox on computers can’t install web apps.',
      'Open Songsky in Chrome, Edge or Safari to install it.',
    ];
  }
  if (/Safari\//.test(ua) && !/Chrome|Chromium|Edg\//.test(ua)) {
    return ['In the menu bar, choose File, then Add to Dock.'];
  }
  return [
    'Look for the install icon at the right end of the address bar,',
    'or open the browser menu and choose Install Songsky.',
  ];
}
