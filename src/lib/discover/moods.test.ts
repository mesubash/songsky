import { describe, expect, it } from 'vitest';
import { moodFor } from './moods';

describe('moodFor', () => {
  it('uses weather when it sets the feeling', () => {
    expect(moodFor('rain', 'night')).toEqual({
      title: 'For a rainy night',
      moods: ['Melancholy', 'Yearning', 'Brooding'],
    });
    expect(moodFor('snow', 'day').title).toBe('For a snowy day');
  });

  it('falls back to time of day for clear skies or no weather', () => {
    expect(moodFor('clear', 'day')).toEqual({
      title: 'For a bright day',
      moods: ['Upbeat', 'Energizing', 'Empowering'],
    });
    expect(moodFor(null, 'dawn').title).toBe('For an early morning');
    expect(moodFor(null, 'dusk').title).toBe('For an evening');
  });

  it('uses "an" before a vowel', () => expect(moodFor(null, 'dusk').title).toBe('For an evening'));
});
