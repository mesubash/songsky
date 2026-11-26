import type { Sky } from '$lib/sky/time';
import type { Condition } from '$lib/sky/weather';

export interface SkyMood {
  /** Heading for the section, e.g. "For a rainy night". */
  title: string;
  /** Audius mood names to search, best match first. */
  moods: string[];
}

const TIME_WORDS: Record<Sky, string> = {
  dawn: 'morning',
  day: 'day',
  dusk: 'evening',
  night: 'night',
};

/** Phrases for a clear sky or no weather. */
const CLEAR_WORDS: Record<Sky, string> = {
  dawn: 'early morning',
  day: 'bright day',
  dusk: 'evening',
  night: 'late night',
};

const WEATHER_WORDS: Record<Condition, string> = {
  clear: 'clear',
  cloudy: 'cloudy',
  fog: 'foggy',
  rain: 'rainy',
  snow: 'snowy',
  storm: 'stormy',
};

/** Moods for each time of day, used when there is no weather or it is clear. */
const BY_TIME: Record<Sky, string[]> = {
  dawn: ['Peaceful', 'Easygoing', 'Tender'],
  day: ['Upbeat', 'Energizing', 'Empowering'],
  dusk: ['Romantic', 'Easygoing', 'Sophisticated'],
  night: ['Cool', 'Sensual', 'Sophisticated'],
};

/** Weather overrides time of day when it sets a stronger feeling. */
const BY_WEATHER: Partial<Record<Condition, { day: string[]; night: string[] }>> = {
  rain: {
    day: ['Sentimental', 'Peaceful', 'Yearning'],
    night: ['Melancholy', 'Yearning', 'Brooding'],
  },
  storm: { day: ['Brooding', 'Stirring', 'Serious'], night: ['Brooding', 'Melancholy', 'Serious'] },
  fog: {
    day: ['Peaceful', 'Sentimental', 'Yearning'],
    night: ['Melancholy', 'Peaceful', 'Yearning'],
  },
  snow: { day: ['Peaceful', 'Tender', 'Sentimental'], night: ['Peaceful', 'Tender', 'Romantic'] },
  cloudy: {
    day: ['Easygoing', 'Sophisticated', 'Sentimental'],
    night: ['Cool', 'Easygoing', 'Yearning'],
  },
};

/** What to play for this sky: "For a rainy night" → melancholy, yearning, brooding. */
export function moodFor(condition: Condition | null, sky: Sky): SkyMood {
  const time = TIME_WORDS[sky];
  const weather = condition ? BY_WEATHER[condition] : undefined;
  const dark = sky === 'night' || sky === 'dusk';
  const moods = weather ? (dark ? weather.night : weather.day) : BY_TIME[sky];
  const words =
    condition && condition !== 'clear' ? `${WEATHER_WORDS[condition]} ${time}` : CLEAR_WORDS[sky];
  const article = /^[aeiou]/.test(words) ? 'an' : 'a';
  return { title: `For ${article} ${words}`, moods };
}
