import { describe, expect, it } from 'vitest';
import { shortcutFor } from './shortcuts';

const press = (key: string, mods: Partial<KeyboardEvent> = {}) =>
  shortcutFor({ key, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, ...mods });

describe('shortcutFor', () => {
  it('maps plain keys, ignoring case', () => {
    expect(press(' ')).toBe('toggle');
    expect(press('K')).toBe('toggle');
    expect(press('ArrowRight')).toBe('seek-forward');
    expect(press('/')).toBe('search');
  });

  it('uses Shift for songs and volume', () => {
    expect(press('ArrowRight', { shiftKey: true })).toBe('next');
    expect(press('ArrowDown', { shiftKey: true })).toBe('volume-down');
    expect(press('?', { shiftKey: true })).toBe('help');
  });

  it('leaves browser shortcuts alone', () => {
    expect(press('r', { metaKey: true })).toBeNull();
    expect(press('f', { ctrlKey: true })).toBeNull();
    expect(press('x')).toBeNull();
  });
});
