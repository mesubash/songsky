<script lang="ts">
import { sky } from '$lib/sky/sky.svelte';

/**
 * Falling rain or snow drawn over the sky layer. Kept faint so it never competes with the
 * music, and skipped entirely for reduced motion.
 */
interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
}

let canvas: HTMLCanvasElement;

const kind = $derived.by(() => {
  const condition = sky.weather?.condition;
  if (condition === 'rain' || condition === 'storm') return 'rain';
  if (condition === 'snow') return 'snow';
  return null;
});

$effect(() => {
  const current = kind;
  const storm = sky.weather?.condition === 'storm';
  const context = canvas.getContext('2d');
  if (!current || !context || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const dpr = devicePixelRatio;
  let particles: Particle[] = [];

  const spawn = (anywhere: boolean): Particle => ({
    x: Math.random() * canvas.width,
    y: anywhere ? Math.random() * canvas.height : -20 * dpr,
    size: current === 'rain' ? (10 + Math.random() * 14) * dpr : (1 + Math.random() * 2) * dpr,
    speed:
      current === 'rain'
        ? (storm ? 1.4 : 1) * (0.7 + Math.random() * 0.4) * dpr
        : (0.04 + Math.random() * 0.05) * dpr,
    phase: Math.random() * Math.PI * 2,
  });

  const resize = () => {
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    const area = innerWidth * innerHeight;
    // ponytail: density scales with screen area and is capped so phones stay cool.
    const count = Math.min(
      current === 'rain' ? 140 : 90,
      Math.round(area / (current === 'rain' ? 8000 : 12000)),
    );
    particles = Array.from({ length: count }, () => spawn(true));
  };
  resize();
  addEventListener('resize', resize);

  const color = getComputedStyle(canvas).getPropertyValue('--text').trim();
  let frame = 0;
  let last = performance.now();

  const tick = (now: number) => {
    const dt = Math.min(now - last, 50);
    last = now;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = dpr;
    context.globalAlpha = current === 'rain' ? 0.22 : 0.5;
    context.beginPath();

    for (const p of particles) {
      if (current === 'rain') {
        p.y += p.speed * dt;
        p.x -= p.speed * dt * 0.15;
        context.moveTo(p.x, p.y);
        context.lineTo(p.x + p.size * 0.15, p.y - p.size);
      } else {
        p.y += p.speed * dt;
        p.phase += dt * 0.001;
        const x = p.x + Math.sin(p.phase) * 12 * dpr;
        context.moveTo(x + p.size, p.y);
        context.arc(x, p.y, p.size, 0, Math.PI * 2);
      }
      if (p.y - p.size > canvas.height) Object.assign(p, spawn(false));
    }

    if (current === 'rain') context.stroke();
    else context.fill();
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(frame);
    removeEventListener('resize', resize);
    context.clearRect(0, 0, canvas.width, canvas.height);
  };
});
</script>

<canvas bind:this={canvas} class="effects" aria-hidden="true"></canvas>

<style>
.effects {
  position: fixed;
  inset: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
