import { describe, expect, it } from 'vitest';
import { CadenceTracker } from './cadence';

const GRAVITY = 9.81;

/** Simulated phone in a pocket: a bump per step plus some jitter, sampled at 60 Hz. */
function walk(stepsPerMinute: number, seconds: number, jitter = 0.4): CadenceTracker {
  const tracker = new CadenceTracker();
  const hz = stepsPerMinute / 60;
  let seed = 1;
  const noise = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed / 2147483647 - 0.5) * 2 * jitter;
  };
  for (let t = 0; t < seconds * 1000; t += 1000 / 60) {
    tracker.add(t, GRAVITY + 3 * Math.sin(2 * Math.PI * hz * (t / 1000)) + noise());
  }
  return tracker;
}

describe('CadenceTracker', () => {
  it.each([100, 120, 168])('measures %i steps per minute', (spm) => {
    const cadence = walk(spm, 12).cadence ?? 0;
    expect(Math.abs(cadence - spm)).toBeLessThanOrEqual(spm * 0.04);
  });

  it('reports nothing while standing still', () => {
    const tracker = new CadenceTracker();
    for (let t = 0; t < 10_000; t += 16) tracker.add(t, GRAVITY + (t % 32 === 0 ? 0.2 : -0.2));
    expect(tracker.cadence).toBeNull();
  });

  it('needs a few steps before it answers', () => {
    expect(walk(120, 2).cadence).toBeNull();
  });
});
