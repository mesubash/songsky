import { describeSky, type Range, type YearStats } from './stats';

const W = 1080;
const H = 1350;

const RANGE_TITLES: Record<Range, (now: Date) => string> = {
  month: (now) => `My ${now.toLocaleDateString('en-GB', { month: 'long' })} in Songsky`,
  year: (now) => `My ${now.getFullYear()} in Songsky`,
  all: () => 'My Songsky so far',
};

/** Shortens text with "…" so it fits `max` pixels. */
function clip(context: CanvasRenderingContext2D, text: string, max: number): string {
  if (context.measureText(text).width <= max) return text;
  let cut = text;
  while (cut.length > 1 && context.measureText(`${cut}…`).width > max) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

/** Draws the year card in the current sky's colours, as a PNG file to share or save. */
export async function renderYear(stats: YearStats, range: Range, now = new Date()): Promise<File> {
  await document.fonts.ready;
  const root = getComputedStyle(document.documentElement);
  const css = (name: string) => root.getPropertyValue(name).trim();
  const display = css('--font-display') || 'sans-serif';
  const sans = css('--font-sans') || 'sans-serif';
  const text = css('--text') || '#fff';
  const muted = css('--text-muted') || 'rgba(255,255,255,0.7)';
  const accent = css('--accent') || '#f6b26b';

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('Canvas is not available');

  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, css('--sky-top') || '#1d2350');
  sky.addColorStop(0.6, css('--sky-mid') || '#5b3f7a');
  sky.addColorStop(1, css('--sky-horizon') || '#c46a5a');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);

  // A low horizon line, the same motif as the logo.
  c.strokeStyle = accent;
  c.globalAlpha = 0.5;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(90, H - 170);
  c.lineTo(W - 90, H - 170);
  c.stroke();
  c.globalAlpha = 1;

  const x = 90;
  c.fillStyle = muted;
  c.font = `600 34px ${sans}`;
  c.fillText('Songsky', x, 130);

  c.fillStyle = text;
  c.font = `700 76px ${display}`;
  c.fillText(clip(c, RANGE_TITLES[range](now), W - 2 * x), x, 230);

  // Big numbers.
  const figures = [
    [stats.plays.toLocaleString(), stats.plays === 1 ? 'play' : 'plays'],
    [stats.minutes.toLocaleString(), 'minutes'],
    [stats.days.toLocaleString(), stats.days === 1 ? 'day' : 'days'],
  ];
  figures.forEach(([value, label], i) => {
    const fx = x + i * 310;
    c.fillStyle = accent;
    c.font = `700 84px ${display}`;
    c.fillText(value ?? '', fx, 380);
    c.fillStyle = muted;
    c.font = `500 32px ${sans}`;
    c.fillText(label ?? '', fx, 425);
  });

  c.fillStyle = muted;
  c.font = `600 32px ${sans}`;
  c.fillText('Top songs', x, 530);
  stats.topSongs.slice(0, 5).forEach((song, i) => {
    const y = 600 + i * 86;
    c.fillStyle = accent;
    c.font = `700 44px ${display}`;
    c.fillText(String(i + 1), x, y);
    c.fillStyle = text;
    c.font = `600 40px ${sans}`;
    c.fillText(clip(c, song.label, W - x - 160), x + 70, y - 8);
    c.fillStyle = muted;
    c.font = `400 28px ${sans}`;
    c.fillText(clip(c, song.sub ?? '', W - x - 160), x + 70, y + 30);
  });

  const facts: string[] = [];
  if (stats.topArtists[0]) facts.push(`Most played artist: ${stats.topArtists[0].label}`);
  if (stats.sky) facts.push(`Favourite sky: ${describeSky(stats.sky)}`);
  if (stats.topPlace) facts.push(`Top place: ${stats.topPlace.label}`);
  c.font = `500 32px ${sans}`;
  facts.forEach((fact, i) => {
    c.fillStyle = text;
    c.fillText(clip(c, fact, W - 2 * x), x, 1060 + i * 48);
  });

  c.fillStyle = muted;
  c.font = `500 28px ${sans}`;
  c.fillText('songsky.subashsdhami.com.np', x, H - 110);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not draw the picture');
  const name = range === 'year' ? `songsky-${now.getFullYear()}.png` : `songsky-${range}.png`;
  return new File([blob], name, { type: 'image/png' });
}
