<script lang="ts">
import { player } from '$lib/player/player.svelte';

/**
 * A horizon drawn from the music: the spectrum is mirrored so bass rises in the middle
 * and highs fall away at the edges, like a sun coming up over the hills.
 */
const POINTS = 32;
const MIN_HZ = 40;
const MAX_HZ = 16000;
/** How quickly the shape follows the music (0..1); lower is calmer. */
const EASE = 0.35;

let canvas: HTMLCanvasElement;
const levels = new Float32Array(POINTS);

/** Analyser bin ranges, spaced on a log scale so each point covers a musical octave slice. */
function binRanges(analyser: AnalyserNode): [number, number][] {
  const hzPerBin = analyser.context.sampleRate / analyser.fftSize;
  const ratio = MAX_HZ / MIN_HZ;
  return Array.from({ length: POINTS }, (_, i) => {
    const from = MIN_HZ * ratio ** (i / POINTS);
    const to = MIN_HZ * ratio ** ((i + 1) / POINTS);
    const start = Math.floor(from / hzPerBin);
    return [start, Math.max(start + 1, Math.ceil(to / hzPerBin))];
  });
}

function draw(context: CanvasRenderingContext2D, glow: string, line: string): void {
  const { width, height } = canvas;
  context.clearRect(0, 0, width, height);

  // Mirror: highs on the left edge → bass in the middle → highs on the right edge.
  const values = [...levels].reverse().concat([...levels]);
  const step = width / (values.length - 1);
  const y = (v: number) => height - v * height * 0.92;

  context.beginPath();
  context.moveTo(0, y(values[0] ?? 0));
  for (let i = 1; i < values.length; i++) {
    const x = i * step;
    const prevX = (i - 1) * step;
    const midX = (prevX + x) / 2;
    context.bezierCurveTo(
      midX,
      y(values[i - 1] ?? 0),
      midX,
      y(values[i] ?? 0),
      x,
      y(values[i] ?? 0),
    );
  }

  context.lineWidth = 2 * devicePixelRatio;
  context.strokeStyle = line;
  context.stroke();

  context.lineTo(width, height);
  context.lineTo(0, height);
  context.closePath();
  const fill = context.createLinearGradient(0, 0, 0, height);
  fill.addColorStop(0, glow);
  fill.addColorStop(1, 'transparent');
  context.globalAlpha = 0.55;
  context.fillStyle = fill;
  context.fill();
  context.globalAlpha = 1;
}

$effect(() => {
  const analyser = player.analyser;
  const playing = player.playing;
  const context = canvas.getContext('2d');
  if (!context) return;

  const styles = getComputedStyle(canvas);
  const glow = styles.getPropertyValue('--glow').trim();
  const line = styles.getPropertyValue('--text').trim();

  const resize = () => {
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    draw(context, glow, line); // Resizing clears the canvas.
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let frame = 0;
  if (analyser && playing && !reduceMotion) {
    const ranges = binRanges(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      ranges.forEach(([start, end], i) => {
        let sum = 0;
        for (let bin = start; bin < end; bin++) sum += data[bin] ?? 0;
        const target = sum / (end - start) / 255;
        levels[i] = (levels[i] ?? 0) + (target - (levels[i] ?? 0)) * EASE;
      });
      draw(context, glow, line);
      frame = requestAnimationFrame(tick);
    };
    tick();
  } else {
    // Paused or reduced motion: settle to a flat horizon.
    levels.fill(0);
  }
  resize();

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
  };
});
</script>

<canvas bind:this={canvas} class="visualizer" aria-hidden="true"></canvas>

<style>
.visualizer {
  width: 100%;
  height: 100%;
}
</style>
