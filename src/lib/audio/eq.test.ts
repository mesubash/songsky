import { describe, expect, it } from 'vitest';
import { EQ_BANDS, EQ_PRESETS, fadeLength, presetFor } from './eq';

describe('presets', () => {
  it('have one gain per band', () => {
    for (const preset of Object.values(EQ_PRESETS)) {
      expect(preset.gains).toHaveLength(EQ_BANDS.length);
    }
  });

  it('are recognised from their gains', () => {
    expect(presetFor([0, 0, 0, 0, 0])).toBe('flat');
    expect(presetFor([6, 3, 0, 0, 0])).toBe('bass');
    expect(presetFor([1, 0, 0, 0, 0])).toBeNull();
  });
});

describe('fadeLength', () => {
  it('uses the setting when there is room', () => expect(fadeLength(6, 30, 200)).toBe(6));
  it('is capped by what is left of the old song', () => expect(fadeLength(6, 2, 200)).toBe(2));
  it('is capped by half of a short new song', () => expect(fadeLength(6, 30, 8)).toBe(4));
  it('ignores an unknown new duration', () => expect(fadeLength(6, 30, 0)).toBe(6));
  it('is zero when off', () => expect(fadeLength(0, 30, 200)).toBe(0));
});
