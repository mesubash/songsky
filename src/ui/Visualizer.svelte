<script lang="ts">
import { BANDS, bandRanges, readBands, traceHorizon } from '$lib/audio/spectrum';
import { player } from '$lib/player/player.svelte';

/**
 * A horizon drawn from the music: the spectrum is mirrored so bass rises in the middle
 * and highs fall away at the edges, like a sun coming up over the hills.
 */
/** How quickly the shape follows the music (0..1); lower is calmer. */
const EASE = 0.35;

let canvas: HTMLCanvasElement;
const levels = new Float32Array(BANDS);

function draw(context: CanvasRenderingContext2D, glow: string, line: string): void {
  const { width, height } = canvas;
  context.clearRect(0, 0, width, height);
  traceHorizon(context, levels, { x: 0, y: height * 0.08, width, height: height * 0.92 });

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
    const ranges = bandRanges(analyser.context.sampleRate, analyser.fftSize);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const target = new Float32Array(BANDS);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      readBands(data, ranges, target);
      target.forEach((value, i) => {
        levels[i] = (levels[i] ?? 0) + (value - (levels[i] ?? 0)) * EASE;
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
