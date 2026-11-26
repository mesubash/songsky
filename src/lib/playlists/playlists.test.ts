import { describe, expect, it } from 'vitest';
import { nextName } from './playlists.svelte';

describe('nextName', () => {
  it('counts up and skips names already taken', () => {
    expect(nextName([])).toBe('Playlist 1');
    expect(nextName(['Gym'])).toBe('Playlist 2');
    expect(nextName(['Playlist 2', 'Gym'])).toBe('Playlist 3');
  });
});
