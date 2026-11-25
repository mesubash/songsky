import { describe, expect, it } from 'vitest';
import { isAudioFile, titleFromFileName, trackIdFor } from './files';

describe('isAudioFile', () => {
  it('accepts common audio extensions in any case', () => {
    for (const name of ['a.mp3', 'b.FLAC', 'c.m4a', 'd.opus', 'e.wav']) {
      expect(isAudioFile(name)).toBe(true);
    }
  });

  it('rejects other files', () => {
    for (const name of ['cover.jpg', 'notes.txt', 'mp3', '.DS_Store']) {
      expect(isAudioFile(name)).toBe(false);
    }
  });
});

describe('trackIdFor', () => {
  it('is the same for the same file and differs when it changes', () => {
    const file = { name: 'a.mp3', size: 10, lastModified: 1 };
    expect(trackIdFor(file)).toBe(trackIdFor({ ...file }));
    expect(trackIdFor(file)).not.toBe(trackIdFor({ ...file, size: 11 }));
  });
});

describe('titleFromFileName', () => {
  it('drops the extension and underscores', () => {
    expect(titleFromFileName('02_my_song.mp3')).toBe('02 my song');
  });

  it('falls back to the name when nothing is left', () => {
    expect(titleFromFileName('.mp3')).toBe('.mp3');
  });
});
