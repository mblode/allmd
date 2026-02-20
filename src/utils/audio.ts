import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import ffmpegStatic from "ffmpeg-static";

const execFile = promisify(execFileCb);
const ffmpegPath = ffmpegStatic as unknown as string | null;

/** OpenAI Whisper hard limit */
export const WHISPER_MAX_BYTES = 26_214_400; // 25 MiB

/** Safety margin for VBR fluctuation and MP3 frame overhead */
export const SAFE_MAX_BYTES = 24_000_000; // ~22.9 MiB

/** Absolute minimum bitrate — below this, transcription quality degrades */
const MIN_BITRATE_KBPS = 32;

/** Sample rate Whisper uses natively — downsampling to this loses nothing */
const SPEECH_SAMPLE_RATE = 16_000;

/**
 * Max duration (seconds) that fits at MIN_BITRATE_KBPS mono.
 * 32kbps = 4000 bytes/s → 24_000_000 / 4000 = 6000s ≈ 100 min
 */
const MAX_SINGLE_CHUNK_SECONDS = 6000;

/** Duration of each chunk when splitting long audio */
const CHUNK_DURATION_SECONDS = 1500; // 25 min

/** Overlap between chunks to avoid losing words at boundaries */
const CHUNK_OVERLAP_SECONDS = 15;

const DURATION_REGEX = /Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/;

export function isAudioOversized(audioBuffer: Buffer): boolean {
  return audioBuffer.byteLength > SAFE_MAX_BYTES;
}

export async function getAudioDuration(filePath: string): Promise<number> {
  if (!ffmpegPath) {
    throw new Error(
      "ffmpeg binary not found. Install ffmpeg or ffmpeg-static."
    );
  }

  try {
    await execFile(ffmpegPath, ["-hide_banner", "-i", filePath], {
      timeout: 30_000,
    });
  } catch (err: unknown) {
    // ffmpeg exits with code 1 when no output is specified, but still
    // prints duration info to stderr — this is expected behaviour.
    const stderr = (err as { stderr?: string }).stderr ?? "";
    const match = stderr.match(DURATION_REGEX);
    if (match) {
      const hours = Number.parseInt(match[1], 10);
      const minutes = Number.parseInt(match[2], 10);
      const seconds = Number.parseInt(match[3], 10);
      const centiseconds = Number.parseInt(match[4], 10);
      return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
    }
    throw new Error(`Could not determine audio duration for ${filePath}`);
  }
  throw new Error(`Could not determine audio duration for ${filePath}`);
}

export function calculateTargetBitrate(
  durationSeconds: number,
  maxBytes: number = SAFE_MAX_BYTES
): number {
  const targetKbps = Math.floor((maxBytes * 8) / durationSeconds / 1000);
  return Math.max(targetKbps, MIN_BITRATE_KBPS);
}

export function needsChunking(durationSeconds: number): boolean {
  return durationSeconds > MAX_SINGLE_CHUNK_SECONDS;
}

export interface ChunkBoundary {
  durationSeconds: number;
  index: number;
  startSeconds: number;
}

export function calculateChunkBoundaries(
  totalDurationSeconds: number
): ChunkBoundary[] {
  const chunks: ChunkBoundary[] = [];
  let start = 0;
  let index = 0;

  while (start < totalDurationSeconds) {
    const remaining = totalDurationSeconds - start;
    const duration = Math.min(CHUNK_DURATION_SECONDS, remaining);
    chunks.push({ startSeconds: start, durationSeconds: duration, index });
    start += CHUNK_DURATION_SECONDS - CHUNK_OVERLAP_SECONDS;
    index++;
  }

  return chunks;
}

export async function compressAudio(
  inputPath: string,
  outputPath: string,
  bitrateKbps: number
): Promise<void> {
  if (!ffmpegPath) {
    throw new Error("ffmpeg binary not found.");
  }

  await execFile(
    ffmpegPath,
    [
      "-y",
      "-i",
      inputPath,
      "-ac",
      "1",
      "-ar",
      String(SPEECH_SAMPLE_RATE),
      "-b:a",
      `${bitrateKbps}k`,
      "-f",
      "mp3",
      outputPath,
    ],
    { timeout: 300_000 }
  );
}

export async function extractAudioChunk(
  inputPath: string,
  outputPath: string,
  startSeconds: number,
  durationSeconds: number,
  bitrateKbps: number
): Promise<void> {
  if (!ffmpegPath) {
    throw new Error("ffmpeg binary not found.");
  }

  await execFile(
    ffmpegPath,
    [
      "-y",
      "-ss",
      String(startSeconds),
      "-t",
      String(durationSeconds),
      "-i",
      inputPath,
      "-ac",
      "1",
      "-ar",
      String(SPEECH_SAMPLE_RATE),
      "-b:a",
      `${bitrateKbps}k`,
      "-f",
      "mp3",
      outputPath,
    ],
    { timeout: 300_000 }
  );
}
