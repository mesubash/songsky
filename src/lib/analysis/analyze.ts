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

/** The beat detector assumes 44.1 kHz audio, so the analysed slice is upsampled for it. */
const BEAT_RATE = 44100;

async function toBeatRate(
  mono: Float32Array<ArrayBuffer>,
  sampleRate: number,
): Promise<AudioBuffer> {
  const source = new AudioBuffer({ length: mono.length, numberOfChannels: 1, sampleRate });
  source.copyToChannel(mono, 0);
  const length = Math.ceil((mono.length / sampleRate) * BEAT_RATE);
  const context = new OfflineAudioContext(1, length, BEAT_RATE);
  const node = new AudioBufferSourceNode(context, { buffer: source });
  node.connect(context.destination);
  node.start();
  return context.startRendering();
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
    const { bpm } = await guess(await toBeatRate(mono, decoded.sampleRate), {
      minTempo: 70,
      maxTempo: 180,
    });
    if (Number.isFinite(bpm) && bpm > 0) result.bpm = Math.round(bpm);
  } catch {
    // No steady beat (ambient, spoken word): leave tempo unknown.
  }
  const key = detectKey(mono, decoded.sampleRate);
  result.key = keyName(key);
  result.camelot = camelot(key);
  return result;
}
