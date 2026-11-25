import type { EqPresetId } from '$lib/audio/eq';
import type { Sky } from './time';

export type Condition = 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm';

export interface Weather {
  condition: Condition;
  /** Short description, e.g. "Light rain". */
  label: string;
  /** °C, rounded. */
  temperature: number;
}

export interface Place {
  name: string;
  latitude: number;
  longitude: number;
}

/** WMO weather codes, as used by Open-Meteo. */
const CODES: [codes: number[], condition: Condition, label: string][] = [
  [[0], 'clear', 'Clear'],
  [[1], 'clear', 'Mostly clear'],
  [[2], 'cloudy', 'Partly cloudy'],
  [[3], 'cloudy', 'Cloudy'],
  [[45, 48], 'fog', 'Fog'],
  [[51, 53, 55, 56, 57], 'rain', 'Drizzle'],
  [[61, 80], 'rain', 'Light rain'],
  [[63, 66, 81], 'rain', 'Rain'],
  [[65, 67, 82], 'rain', 'Heavy rain'],
  [[71, 77, 85], 'snow', 'Light snow'],
  [[73, 75, 86], 'snow', 'Snow'],
  [[95, 96, 99], 'storm', 'Thunderstorm'],
];

export function describeCode(code: number): { condition: Condition; label: string } {
  const match = CODES.find(([codes]) => codes.includes(code));
  return match
    ? { condition: match[1], label: match[2] }
    : { condition: 'cloudy', label: 'Cloudy' };
}

/** One decimal place is about 11 km: enough for weather, vague enough to stay private. */
export function roundCoordinate(value: number): number {
  return Math.round(value * 10) / 10;
}

export function forecastUrl(place: Pick<Place, 'latitude' | 'longitude'>): string {
  const params = new URLSearchParams({
    latitude: String(roundCoordinate(place.latitude)),
    longitude: String(roundCoordinate(place.longitude)),
    current: 'weather_code,temperature_2m',
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

export async function fetchWeather(place: Place): Promise<Weather> {
  const response = await fetch(forecastUrl(place));
  if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
  const data: { current: { weather_code: number; temperature_2m: number } } = await response.json();
  return {
    ...describeCode(data.current.weather_code),
    temperature: Math.round(data.current.temperature_2m),
  };
}

export async function searchPlaces(query: string): Promise<Place[]> {
  const params = new URLSearchParams({ name: query, count: '5', language: 'en', format: 'json' });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  if (!response.ok) throw new Error(`Place search failed: ${response.status}`);
  const data: {
    results?: {
      name: string;
      admin1?: string;
      country?: string;
      latitude: number;
      longitude: number;
    }[];
  } = await response.json();
  return (data.results ?? []).map((r) => ({
    name: [r.name, r.admin1, r.country]
      .filter((part, i, all) => part && all.indexOf(part) === i)
      .join(', '),
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

/** A sound that suits the moment, or null when the current one is fine. */
export function suggestedPreset(condition: Condition, sky: Sky): EqPresetId | null {
  if (condition === 'rain' || condition === 'storm' || condition === 'fog') return 'warm';
  if (condition === 'snow') return 'vocal';
  if (condition === 'clear' && (sky === 'day' || sky === 'dawn')) return 'bright';
  return null;
}
