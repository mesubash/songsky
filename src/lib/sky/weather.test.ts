import { describe, expect, it } from 'vitest';
import {
  describeCode,
  forecastUrl,
  formatCoordinates,
  roundCoordinate,
  suggestedPreset,
} from './weather';

describe('describeCode', () => {
  it.each([
    [0, 'clear'],
    [2, 'cloudy'],
    [45, 'fog'],
    [53, 'rain'],
    [82, 'rain'],
    [75, 'snow'],
    [95, 'storm'],
  ])('code %i is %s', (code, condition) => {
    expect(describeCode(code).condition).toBe(condition);
  });

  it('treats unknown codes as cloudy', () => {
    expect(describeCode(1234)).toEqual({ condition: 'cloudy', label: 'Cloudy' });
  });
});

describe('location privacy', () => {
  it('rounds coordinates to about 11 km', () => {
    expect(roundCoordinate(27.71724)).toBe(27.7);
    expect(roundCoordinate(-0.05)).toBe(-0);
  });

  it('only sends rounded coordinates', () => {
    const url = new URL(forecastUrl({ latitude: 27.71724, longitude: 85.32396 }));
    expect(url.searchParams.get('latitude')).toBe('27.7');
    expect(url.searchParams.get('longitude')).toBe('85.3');
  });
});

describe('formatCoordinates', () => {
  it('names a place by its rounded coordinates', () => {
    expect(formatCoordinates(27.71724, 85.32396)).toBe('27.7°N, 85.3°E');
    expect(formatCoordinates(-33.87, -70.66)).toBe('33.9°S, 70.7°W');
  });
});

describe('suggestedPreset', () => {
  it('warms up rainy and foggy moments', () => {
    expect(suggestedPreset('rain', 'night')).toBe('warm');
    expect(suggestedPreset('fog', 'day')).toBe('warm');
  });

  it('brightens clear days only', () => {
    expect(suggestedPreset('clear', 'day')).toBe('bright');
    expect(suggestedPreset('clear', 'night')).toBeNull();
  });

  it('leaves cloudy skies alone', () => expect(suggestedPreset('cloudy', 'dusk')).toBeNull());
});
