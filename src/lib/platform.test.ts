import { describe, expect, it } from 'vitest';
import { installSteps, locationSteps } from './platform';

describe('installSteps', () => {
  it('explains Add to Dock in Safari on a Mac and the menu on Android', () => {
    const mac =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
    expect(installSteps(mac)?.[0]).toContain('Add to Dock');
    const android =
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131 Mobile Safari/537.36';
    expect(installSteps(android)?.join(' ')).toContain('Install app');
  });

  it('tells Firefox users on computers to use another browser', () => {
    expect(
      installSteps('Mozilla/5.0 (Windows NT 10.0) Gecko/20100101 Firefox/133.0')?.[0],
    ).toContain('can’t install');
  });
});

describe('locationSteps', () => {
  it('gives browser-specific steps', () => {
    expect(
      locationSteps('Mozilla/5.0 (Windows NT 10.0) Gecko/20100101 Firefox/133.0').join(' '),
    ).toContain('×');
    expect(
      locationSteps('Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15')[0],
    ).toContain('Websites');
    expect(locationSteps('Mozilla/5.0 (Windows NT 10.0) Chrome/131 Safari/537.36')[0]).toContain(
      'address bar',
    );
  });
});
