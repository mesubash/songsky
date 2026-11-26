import { bandRanges, readBands } from '$lib/audio/spectrum';
import type { Track } from '$lib/library/types';
import { player } from '$lib/player/player.svelte';
import { sky } from '$lib/sky/sky.svelte';
import { toast } from '$lib/toast.svelte';
import { captionFor, renderSongArt } from './render';
import { SongprintStore } from './songprint';

const SAMPLE_MS = 500;

export const songprints = new SongprintStore();

/** Samples the playing song's spectrum twice a second to build its songprint. */
export function startSongprints(): void {
  $effect.root(() => {
    $effect(() => {
      const id = player.current?.id;
      const analyser = player.analyser;
      if (!player.playing || !id || !analyser) return;
      const ranges = bandRanges(analyser.context.sampleRate, analyser.fftSize);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const levels = new Float32Array(ranges.length);
      const timer = setInterval(() => {
        analyser.getByteFrequencyData(data);
        songprints.add(id, readBands(data, ranges, levels));
      }, SAMPLE_MS);
      return () => clearInterval(timer);
    });
  });
}

function fileName(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'song'}-songsky.png`;
}

/** Draws the song art for a track as a PNG file, using the current sky. */
export async function createSongArt(track: Track): Promise<File> {
  const root = getComputedStyle(document.documentElement);
  const read = (name: string) => root.getPropertyValue(name).trim();
  const blob = await renderSongArt({
    title: track.title,
    artist: track.artist,
    caption: captionFor(sky.weather?.condition ?? null, sky.time, new Date()),
    levels: songprints.levels(track.id),
    palette: {
      top: read('--sky-top'),
      mid: read('--sky-mid'),
      horizon: read('--sky-horizon'),
      glow: read('--glow'),
    },
    skyFilter: read('--sky-filter'),
    displayFont: read('--font-display'),
    textFont: read('--font-sans'),
  });
  return new File([blob], fileName(track.title), { type: 'image/png' });
}

/** Whether this browser can hand an image to the system share menu. */
export function canShareFile(file: File): boolean {
  return typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
}

/** Opens the system share menu. Returns false if the person closed it without sharing. */
export async function shareFile(file: File, title: string): Promise<boolean> {
  try {
    await navigator.share({ files: [file], title });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return false;
    throw error;
  }
}

export function downloadFile(file: File, message = 'Song art saved to your downloads.'): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  toast.show(message);
}
