import { describe, expect, it } from 'vitest';
import { logoSvg } from './logo';

const day = {
  top: '#4f86d6',
  mid: '#8fbdf0',
  horizon: '#fde7b0',
  sun: '#ffb347',
  ground: '#16285a',
  moon: '0',
  filter: 'none',
};

describe('logoSvg', () => {
  it('uses the given colours', () => {
    const svg = logoSvg(day);
    expect(svg).toContain('stop-color:#4f86d6');
    expect(svg).toContain('fill:#ffb347');
    expect(svg).toContain('fill:#16285a');
  });

  it('hides the moon cut-out by day and shows it at night', () => {
    expect(logoSvg(day)).toContain('opacity:0"');
    expect(logoSvg({ ...day, moon: '1' })).toContain('opacity:1"');
  });

  it('tints the sky only when there is weather', () => {
    expect(logoSvg(day)).not.toContain('filter:');
    expect(logoSvg({ ...day, filter: 'saturate(0.55)' })).toContain(
      'style="filter:saturate(0.55)"',
    );
  });

  it('keeps ids unique per logo', () => {
    expect(logoSvg(day, 'a')).toContain('id="a-sky"');
    expect(logoSvg(day, 'a')).not.toContain('id="logo-sky"');
  });
});
