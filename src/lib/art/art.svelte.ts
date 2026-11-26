import { bandRanges, readBands } from '$lib/audio/spectrum';
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
  return `${slug || 'song'}-attune.png`;
}

/** Phones get the share sheet; computers download the picture. */
const prefersShare = () => matchMedia('(pointer: coarse)').matches;

export const canShareArt = (): boolean => prefersShare() && 'share' in navigator;

export async function shareSongArt(): Promise<void> {
  const track = player.current;
  if (!track) return;

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
    skyFilter: getComputedStyle(document.body, '::before').filter,
    displayFont: read('--font-display'),
    textFont: read('--font-sans'),
  });

  const file = new File([blob], fileName(track.title), { type: 'image/png' });
  if (prefersShare() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: track.title });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) throw error;
    }
    return;
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  toast.show('Song art saved to your downloads.');
}
