import { guess } from 'web-audio-beat-detector';
import { camelot, detectKey, keyName } from './key';

/** Low sample rate, mono: plenty for tempo and key, and a fraction of the memory. */
const RATE = 11025;
/** Only the middle of the song is analysed; intros and outros often differ. */
const MAX_SECONDS = 90;

export interface Analysis {
  bpm?: number;
  key?: string;
  camelot?: string;
}

export async function analyzeFile(file: Blob): Promise<Analysis> {
  const bytes = await file.arrayBuffer();
  // Decoding through a low-rate context resamples for us.
  const decoded = await new OfflineAudioContext(1, 1, RATE).decodeAudioData(bytes);

  const seconds = Math.min(MAX_SECONDS, decoded.duration);
  const offset = Math.max(0, (decoded.duration - seconds) / 2);
  const start = Math.floor(offset * decoded.sampleRate);
  const length = Math.floor(seconds * decoded.sampleRate);

  const mono = new Float32Array(length);
  for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
    const data = decoded.getChannelData(channel).subarray(start, start + length);
    for (let i = 0; i < data.length; i++) {
      mono[i] = (mono[i] ?? 0) + (data[i] ?? 0) / decoded.numberOfChannels;
    }
  }

  const result: Analysis = {};
  try {
    const { bpm } = await guess(decoded, offset, seconds, { minTempo: 70, maxTempo: 180 });
    if (Number.isFinite(bpm) && bpm > 0) result.bpm = Math.round(bpm);
  } catch {
    // No steady beat (ambient, spoken word): leave tempo unknown.
  }
  const key = detectKey(mono, decoded.sampleRate);
  result.key = keyName(key);
  result.camelot = camelot(key);
  return result;
}
