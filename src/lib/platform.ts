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

/**
 * How to allow location again after blocking it, for this browser. Browsers never let a
 * site ask a second time, so the person has to change it in the browser's own settings.
 */
export function locationSteps(ua = navigator.userAgent): string[] {
  if (isIOS()) {
    return [
      'In Safari, tap the aA button at the left of the address bar, then Website Settings.',
      'Set Location to Allow.',
      'If Location isn’t there: open the Settings app, then Privacy & Security, Location Services, Safari Websites, and choose While Using the App.',
    ];
  }
  if (/Android/i.test(ua)) {
    return [
      'Tap the icon at the left of the address bar.',
      'Tap Permissions (or Site settings), then Location, and choose Allow.',
    ];
  }
  if (/Firefox\//.test(ua)) {
    return [
      'Click the icon at the left of the address bar.',
      'Next to “Access your location: Blocked”, click the × to clear it.',
      'Then press Use my location below and choose Allow.',
    ];
  }
  if (/Safari\//.test(ua) && !/Chrome|Chromium|Edg\//.test(ua)) {
    return [
      'In the menu bar, choose Safari, then Settings, then Websites.',
      'Choose Location on the left, and set this site to Allow.',
    ];
  }
  return [
    'Click the icon at the left of the address bar (a lock or two sliders).',
    'Turn Location on, or open Site settings and set Location to Allow.',
  ];
}
