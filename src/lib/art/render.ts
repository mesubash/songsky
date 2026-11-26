import { traceHorizon } from '$lib/audio/spectrum';
import type { Sky } from '$lib/sky/time';
import type { Condition } from '$lib/sky/weather';

export const ART_WIDTH = 1080;
export const ART_HEIGHT = 1350;

export interface Palette {
  top: string;
  mid: string;
  horizon: string;
  glow: string;
}

export interface ArtInput {
  title: string;
  artist: string;
  caption: string;
  levels: number[];
  palette: Palette;
  /** CSS filter for the sky (weather tint), or "none". */
  skyFilter: string;
  displayFont: string;
  textFont: string;
}

const TIME_PHRASES: Record<Sky, string> = {
  dawn: 'at dawn',
  day: 'by day',
  dusk: 'at dusk',
  night: 'at night',
};

const WEATHER_PHRASES: Record<Condition, string> = {
  clear: 'Clear skies',
  cloudy: 'Under clouds',
  fog: 'In the fog',
  rain: 'In the rain',
  snow: 'In the snow',
  storm: 'In a storm',
};

/** "In the rain at night, 26 Nov 2026" or "Heard at dusk, 26 Nov 2026". */
export function captionFor(weather: Condition | null, time: Sky, date: Date): string {
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const lead = weather ? WEATHER_PHRASES[weather] : 'Heard';
  return `${lead} ${TIME_PHRASES[time]}, ${day}`;
}

/** Greedy word wrap, ending with "…" if the text needs more than `maxLines`. */
export function wrapLines(
  measure: (text: string) => number,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate) <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines.map((l) => fitWidth(measure, l, maxWidth));
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = fitWidth(measure, `${kept[maxLines - 1]}…`, maxWidth);
  return kept;
}

function fitWidth(measure: (text: string) => number, text: string, maxWidth: number): string {
  if (measure(text) <= maxWidth) return text;
  let cut = text.replace(/…$/, '');
  while (cut.length > 1 && measure(`${cut}…`) > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

/** Draws the song art: sky, the song's horizon, its reflection, and the words. */
export async function renderSongArt(input: ArtInput): Promise<Blob> {
  const W = ART_WIDTH;
  const H = ART_HEIGHT;
  const horizonY = Math.round(H * 0.56);
  const { palette } = input;

  await Promise.all([
    document.fonts.load(`700 76px ${input.displayFont}`),
    document.fonts.load(`500 38px ${input.textFont}`),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available');

  // Sky, tinted like the app's sky when the weather calls for it.
  if (input.skyFilter && input.skyFilter !== 'none') context.filter = input.skyFilter;
  const sky = context.createLinearGradient(0, 0, 0, horizonY);
  sky.addColorStop(0, palette.top);
  sky.addColorStop(0.55, palette.mid);
  sky.addColorStop(1, palette.horizon);
  context.fillStyle = sky;
  context.fillRect(0, 0, W, horizonY + 2);
  const glow = context.createRadialGradient(W / 2, horizonY, 0, W / 2, horizonY, W * 0.75);
  glow.addColorStop(0, palette.glow);
  glow.addColorStop(1, 'transparent');
  // "screen" lightens the sky with the glow instead of greying it, by day and by night.
  context.globalCompositeOperation = 'screen';
  context.globalAlpha = 0.85;
  context.fillStyle = glow;
  context.fillRect(0, 0, W, horizonY);
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'source-over';
  context.filter = 'none';

  // The song's horizon: hills shaped by its sound, dark against the glow.
  const ground = '#10132b';
  traceHorizon(context, input.levels, { x: -20, y: horizonY - 300, width: W + 40, height: 300 });
  context.lineTo(W + 20, H);
  context.lineTo(-20, H);
  context.closePath();
  context.fillStyle = ground;
  context.fill();
  traceHorizon(context, input.levels, { x: -20, y: horizonY - 300, width: W + 40, height: 300 });
  context.lineWidth = 3;
  context.strokeStyle = palette.glow;
  context.stroke();

  // Reflection lines, like the app icon.
  context.lineCap = 'round';
  context.lineWidth = 8;
  context.strokeStyle = palette.glow;
  [0.36, 0.24, 0.12].forEach((width, i) => {
    const y = horizonY + 46 + i * 30;
    context.globalAlpha = 0.75 - i * 0.22;
    context.beginPath();
    context.moveTo(W / 2 - (W * width) / 2, y);
    context.lineTo(W / 2 + (W * width) / 2, y);
    context.stroke();
  });
  context.globalAlpha = 1;

  // Words.
  const left = 88;
  const maxWidth = W - left * 2;
  context.textBaseline = 'alphabetic';
  context.fillStyle = '#f4f5fb';
  context.font = `700 76px ${input.displayFont}`;
  const titleLines = wrapLines((t) => context.measureText(t).width, input.title, maxWidth, 2);
  let y = horizonY + 215;
  for (const line of titleLines) {
    context.fillText(line, left, y);
    y += 86;
  }

  context.font = `500 40px ${input.textFont}`;
  context.fillStyle = 'rgb(238 240 250 / 0.75)';
  const [artist = ''] = wrapLines((t) => context.measureText(t).width, input.artist, maxWidth, 1);
  context.fillText(artist, left, y + 4);

  context.font = `400 30px ${input.textFont}`;
  context.fillStyle = 'rgb(238 240 250 / 0.55)';
  context.fillText(input.caption, left, H - 88);

  context.font = `700 34px ${input.displayFont}`;
  context.fillStyle = palette.glow;
  context.textAlign = 'right';
  context.fillText('attune', W - left, H - 88);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not create image'))),
      'image/png',
    ),
  );
}
