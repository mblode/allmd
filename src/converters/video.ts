import { mkdtemp, readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import extractAudio from "ffmpeg-extract-audio";
import pLimit from "p-limit";
import {
  type DiarizedSegment,
  formatAsMarkdown,
  transcribeAudio,
  transcribeAudioDiarized,
} from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import {
  calculateChunkBoundaries,
  calculateTargetBitrate,
  compressAudio,
  DIARIZE_CHUNK_SECONDS,
  extractAudioChunk,
  getAudioDuration,
  isAudioOversized,
  needsChunking,
  WHISPER_MAX_BYTES,
} from "../utils/audio.js";
import { AUDIO_EXTS, VIDEO_EXTS } from "../utils/detect.js";
import { applyFrontmatter } from "../utils/frontmatter.js";
import { trackProgress, verbose } from "../utils/ui.js";

const PARALLEL_TRANSCRIPTIONS = 3;

function transcribeLabel(duration?: number): string {
  if (!duration) {
    return "Transcribing audio...";
  }
  const mins = Math.round(duration / 60);
  if (mins < 1) {
    return `Transcribing ${Math.round(duration)}s of audio...`;
  }
  return `Transcribing ${mins} min of audio...`;
}

const DIARIZE_ACCEPTED_AUDIO_EXTS = new Set([
  ".m4a",
  ".mp3",
  ".mp4",
  ".mpga",
  ".mpeg",
  ".wav",
  ".webm",
]);

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDiarizedSegments(
  segments: Array<{ start: number; text: string; speaker: string }>
): string {
  const lines: string[] = [];
  let currentSpeaker: string | undefined;

  for (const seg of segments) {
    if (seg.speaker !== currentSpeaker) {
      currentSpeaker = seg.speaker;
      if (lines.length > 0) {
        lines.push("");
      }
      lines.push(`**${currentSpeaker}** [${formatTimestamp(seg.start)}]`);
    }
    lines.push(seg.text);
  }

  return lines.join("\n");
}

function deduplicateOverlappingSegments(
  segments: DiarizedSegment[]
): DiarizedSegment[] {
  if (segments.length === 0) {
    return segments;
  }

  const sorted = [...segments].sort((a, b) => a.start - b.start);
  const result: DiarizedSegment[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    // biome-ignore lint/style/noNonNullAssertion: result is guaranteed non-empty here
    const prev = result.at(-1)!;
    const curr = sorted[i];

    // Skip duplicate segments from chunk overlap zones
    if (curr.start < prev.end + 1) {
      const normA = curr.text.trim().toLowerCase();
      const normB = prev.text.trim().toLowerCase();
      if (normA === normB || normA.includes(normB) || normB.includes(normA)) {
        continue;
      }
    }

    result.push(curr);
  }

  return result;
}

async function transcribeDiarized(
  audioBuffer: Buffer,
  filePath: string,
  audioFilename: string,
  options: ConversionOptions,
  duration?: number
): Promise<ConversionResult> {
  const filename = basename(filePath);
  const transcription = await trackProgress(
    options.onProgress,
    transcribeLabel(duration),
    transcribeAudioDiarized(
      audioBuffer,
      options,
      audioFilename,
      options.speakerReferences
    )
  );

  const rawText = formatDiarizedSegments(transcription.segments);
  verbose(
    `Transcription: ${rawText.length.toLocaleString()} chars, ${transcription.speakers.length} speakers`,
    options.verbose
  );

  const markdown = await trackProgress(
    options.onProgress,
    "Formatting with AI...",
    formatAsMarkdown(
      rawText,
      {
        title: filename,
        source: filePath,
        type: "video/audio transcription (diarized)",
      },
      options
    )
  );

  const withFrontmatter = applyFrontmatter(markdown, options, {
    title: filename,
    source: filePath,
    type: "video",
    diarized: true,
    speakers: transcription.speakers,
    transcriptionModel: "gpt-4o-transcribe-diarize",
  });

  verbose(
    `Final output: ${withFrontmatter.length.toLocaleString()} chars`,
    options.verbose
  );
  return {
    title: filename,
    markdown: withFrontmatter,
    rawContent: rawText,
    metadata: {
      diarized: true,
      speakers: transcription.speakers,
      transcriptionModel: "gpt-4o-transcribe-diarize",
    },
  };
}

async function transcribePlain(
  audioBuffer: Buffer,
  filePath: string,
  options: ConversionOptions,
  duration?: number
): Promise<ConversionResult> {
  const filename = basename(filePath);
  const transcription = await trackProgress(
    options.onProgress,
    transcribeLabel(duration),
    transcribeAudio(audioBuffer, options)
  );
  const rawText = transcription.text;
  verbose(
    `Transcription: ${rawText.length.toLocaleString()} chars`,
    options.verbose
  );

  const markdown = await trackProgress(
    options.onProgress,
    "Formatting with AI...",
    formatAsMarkdown(
      rawText,
      { title: filename, source: filePath, type: "video/audio transcription" },
      options
    )
  );

  const withFrontmatter = applyFrontmatter(markdown, options, {
    title: filename,
    source: filePath,
    type: "video",
  });

  verbose(
    `Final output: ${withFrontmatter.length.toLocaleString()} chars`,
    options.verbose
  );
  return {
    title: filename,
    markdown: withFrontmatter,
    rawContent: rawText,
    metadata: {},
  };
}

async function formatChunkedDiarizedResult(
  segments: DiarizedSegment[],
  speakers: string[],
  filePath: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  const filename = basename(filePath);
  const rawText = formatDiarizedSegments(segments);
  verbose(
    `Transcription: ${rawText.length.toLocaleString()} chars, ${speakers.length} speakers`,
    options.verbose
  );

  const markdown = await trackProgress(
    options.onProgress,
    "Formatting with AI...",
    formatAsMarkdown(
      rawText,
      {
        title: filename,
        source: filePath,
        type: "video/audio transcription (diarized)",
      },
      options
    )
  );

  const withFrontmatter = applyFrontmatter(markdown, options, {
    title: filename,
    source: filePath,
    type: "video",
    diarized: true,
    speakers,
    transcriptionModel: "gpt-4o-transcribe-diarize",
  });

  verbose(
    `Final output: ${withFrontmatter.length.toLocaleString()} chars`,
    options.verbose
  );
  return {
    title: filename,
    markdown: withFrontmatter,
    rawContent: rawText,
    metadata: {
      diarized: true,
      speakers,
      transcriptionModel: "gpt-4o-transcribe-diarize",
    },
  };
}

async function formatChunkedPlainResult(
  rawText: string,
  filePath: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  const filename = basename(filePath);
  verbose(
    `Transcription: ${rawText.length.toLocaleString()} chars`,
    options.verbose
  );

  const markdown = await trackProgress(
    options.onProgress,
    "Formatting with AI...",
    formatAsMarkdown(
      rawText,
      { title: filename, source: filePath, type: "video/audio transcription" },
      options
    )
  );

  const withFrontmatter = applyFrontmatter(markdown, options, {
    title: filename,
    source: filePath,
    type: "video",
  });

  verbose(
    `Final output: ${withFrontmatter.length.toLocaleString()} chars`,
    options.verbose
  );
  return {
    title: filename,
    markdown: withFrontmatter,
    rawContent: rawText,
    metadata: {},
  };
}

async function transcribeChunkedDiarized(
  audioPath: string,
  duration: number,
  tempDir: string,
  filesToCleanup: string[],
  options: ConversionOptions
): Promise<{ segments: DiarizedSegment[]; speakers: string[] }> {
  const chunks = calculateChunkBoundaries(duration, DIARIZE_CHUNK_SECONDS);
  const bitratePerChunk = calculateTargetBitrate(chunks[0].durationSeconds);

  verbose(
    `Splitting into ${chunks.length} chunks of ~${Math.round(chunks[0].durationSeconds / 60)} min`,
    options.verbose
  );

  // Extract all chunks first (fast ffmpeg operations)
  const chunkPaths: string[] = [];
  for (const chunk of chunks) {
    const chunkPath = join(tempDir, `chunk-${chunk.index}.mp3`);
    filesToCleanup.push(chunkPath);
    chunkPaths.push(chunkPath);

    options.onProgress?.(
      `Extracting chunk ${chunk.index + 1}/${chunks.length}...`
    );
    verbose(
      `Extracting chunk ${chunk.index + 1}/${chunks.length} (${formatTimestamp(chunk.startSeconds)} – ${formatTimestamp(chunk.startSeconds + chunk.durationSeconds)})`,
      options.verbose
    );

    await extractAudioChunk(
      audioPath,
      chunkPath,
      chunk.startSeconds,
      chunk.durationSeconds,
      bitratePerChunk,
      options.abortSignal
    );
  }

  // Transcribe chunks in parallel
  const limit = pLimit(PARALLEL_TRANSCRIPTIONS);
  const results = await Promise.all(
    chunks.map((chunk, i) =>
      limit(async () => {
        verbose(
          `Transcribing chunk ${chunk.index + 1}/${chunks.length}`,
          options.verbose
        );
        const chunkBuffer = await readFile(chunkPaths[i]);
        const transcription = await trackProgress(
          options.onProgress,
          `Transcribing chunk ${chunk.index + 1}/${chunks.length}...`,
          transcribeAudioDiarized(
            chunkBuffer,
            options,
            `chunk-${chunk.index}.mp3`,
            options.speakerReferences
          )
        );

        // Offset timestamps by chunk start
        return transcription.segments.map((seg) => ({
          ...seg,
          start: seg.start + chunk.startSeconds,
          end: seg.end + chunk.startSeconds,
        }));
      })
    )
  );

  const allSegments = results.flat();
  const dedupedSegments = deduplicateOverlappingSegments(allSegments);
  const uniqueSpeakers = [...new Set(dedupedSegments.map((s) => s.speaker))];

  return { segments: dedupedSegments, speakers: uniqueSpeakers };
}

async function transcribeChunkedPlain(
  audioPath: string,
  duration: number,
  tempDir: string,
  filesToCleanup: string[],
  options: ConversionOptions
): Promise<string> {
  const chunks = calculateChunkBoundaries(duration);
  const bitratePerChunk = calculateTargetBitrate(chunks[0].durationSeconds);

  verbose(
    `Splitting into ${chunks.length} chunks of ~${Math.round(chunks[0].durationSeconds / 60)} min`,
    options.verbose
  );

  // Extract all chunks first (fast ffmpeg operations)
  const chunkPaths: string[] = [];
  for (const chunk of chunks) {
    const chunkPath = join(tempDir, `chunk-${chunk.index}.mp3`);
    filesToCleanup.push(chunkPath);
    chunkPaths.push(chunkPath);

    options.onProgress?.(
      `Extracting chunk ${chunk.index + 1}/${chunks.length}...`
    );
    verbose(
      `Extracting chunk ${chunk.index + 1}/${chunks.length} (${formatTimestamp(chunk.startSeconds)} – ${formatTimestamp(chunk.startSeconds + chunk.durationSeconds)})`,
      options.verbose
    );

    await extractAudioChunk(
      audioPath,
      chunkPath,
      chunk.startSeconds,
      chunk.durationSeconds,
      bitratePerChunk,
      options.abortSignal
    );
  }

  // Transcribe chunks in parallel
  const limit = pLimit(PARALLEL_TRANSCRIPTIONS);
  const results = await Promise.all(
    chunks.map((chunk, i) =>
      limit(async () => {
        verbose(
          `Transcribing chunk ${chunk.index + 1}/${chunks.length}`,
          options.verbose
        );
        const chunkBuffer = await readFile(chunkPaths[i]);
        return await trackProgress(
          options.onProgress,
          `Transcribing chunk ${chunk.index + 1}/${chunks.length}...`,
          transcribeAudio(chunkBuffer, options).then((t) => t.text)
        );
      })
    )
  );

  return results.join(" ");
}

interface ParsedVideoOptions {
  diarize: boolean;
  isAudio: boolean;
  isVideo: boolean;
  speakerNames: string[];
  speakerReferences: string[];
}

function parseVideoOptions(
  filePath: string,
  options: ConversionOptions
): ParsedVideoOptions {
  const ext = extname(filePath).toLowerCase();
  const isAudio = AUDIO_EXTS.has(ext);
  const isVideo = VIDEO_EXTS.has(ext);
  const speakerNames = (options.speakers ?? [])
    .map((name) => name.trim())
    .filter(Boolean);
  const speakerReferences = (options.speakerReferences ?? [])
    .map((reference) => reference.trim())
    .filter(Boolean);
  const hasSpeakerHints =
    speakerNames.length > 0 || speakerReferences.length > 0;

  if (!(isAudio || isVideo)) {
    throw new Error(
      `Unsupported format: ${ext}. Supported video: ${[...VIDEO_EXTS].join(", ")}. Audio: ${[...AUDIO_EXTS].join(", ")}`
    );
  }

  if (speakerReferences.length > 0 && speakerNames.length === 0) {
    throw new Error(
      "Known speaker references require --speakers so each reference can be matched to a name."
    );
  }

  const diarize = hasSpeakerHints ? true : (options.diarize ?? true);

  verbose(
    `Processing ${isVideo ? "video" : "audio"} file: ${filePath}`,
    options.verbose
  );

  if (diarize) {
    verbose(
      "Diarization enabled — using gpt-4o-transcribe-diarize",
      options.verbose
    );
  }

  if (hasSpeakerHints && options.diarize === false) {
    verbose(
      "Speaker options imply diarization; ignoring --no-diarize.",
      options.verbose
    );
  }

  return { isAudio, isVideo, speakerNames, speakerReferences, diarize };
}

async function compressAndTranscribe(
  audioPath: string,
  audioBuffer: Buffer,
  filePath: string,
  tempDir: string,
  filesToCleanup: string[],
  duration: number,
  diarize: boolean,
  options: ConversionOptions
): Promise<ConversionResult> {
  verbose(
    `Audio exceeds Whisper limit (${Math.round(audioBuffer.byteLength / 1024 / 1024)} MB). Compressing...`,
    options.verbose
  );

  const targetBitrate = calculateTargetBitrate(duration);
  verbose(`Compressing to ${targetBitrate}kbps mono 16kHz`, options.verbose);

  options.onProgress?.("Compressing audio...");
  const compressedPath = join(tempDir, "compressed.mp3");
  filesToCleanup.push(compressedPath);
  await compressAudio(
    audioPath,
    compressedPath,
    targetBitrate,
    options.abortSignal
  );

  const compressedBuffer = await readFile(compressedPath);
  verbose(
    `Compressed size: ${Math.round(compressedBuffer.byteLength / 1024)} KB`,
    options.verbose
  );

  if (compressedBuffer.byteLength > WHISPER_MAX_BYTES) {
    throw new Error(
      `Compressed audio still exceeds 25MB limit (${Math.round(compressedBuffer.byteLength / 1024 / 1024)} MB). Please report this as a bug.`
    );
  }

  if (diarize) {
    return await transcribeDiarized(
      compressedBuffer,
      filePath,
      "compressed.mp3",
      options,
      duration
    );
  }
  return await transcribePlain(compressedBuffer, filePath, options, duration);
}

export async function convertVideo(
  filePath: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  const { isAudio, isVideo, diarize } = parseVideoOptions(filePath, options);

  const ext = extname(filePath).toLowerCase();
  let audioPath: string;
  let tempDir: string | undefined;
  const filesToCleanup: string[] = [];
  const shouldTranscodeForDiarization =
    diarize && isAudio && !DIARIZE_ACCEPTED_AUDIO_EXTS.has(ext);

  if (isVideo || shouldTranscodeForDiarization) {
    options.onProgress?.("Extracting audio...");
    verbose("Extracting audio track with ffmpeg...", options.verbose);
    tempDir = await mkdtemp(join(tmpdir(), "md-video-"));
    audioPath = join(tempDir, "audio.mp3");
    filesToCleanup.push(audioPath);
    await extractAudio({ input: filePath, output: audioPath, format: "mp3" });
    verbose(`Audio extracted to ${audioPath}`, options.verbose);
  } else {
    audioPath = filePath;
  }

  try {
    const audioBuffer = await readFile(audioPath);
    const oversized = isAudioOversized(audioBuffer);
    verbose(
      `Audio size: ${Math.round(audioBuffer.byteLength / 1024)} KB`,
      options.verbose
    );

    // Always get duration when diarize is on (API has 1400s limit) or file is oversized
    options.onProgress?.("Detecting duration...");
    const duration =
      diarize || oversized
        ? await getAudioDuration(audioPath, options.abortSignal)
        : undefined;

    if (duration) {
      verbose(`Audio duration: ${Math.round(duration)}s`, options.verbose);
    }

    // Check if chunking is needed (diarize limit: 1400s, whisper size limit: 6000s)
    if (duration && needsChunking(duration, diarize)) {
      if (!tempDir) {
        tempDir = await mkdtemp(join(tmpdir(), "md-video-"));
      }
      return await handleChunkedTranscription(
        audioPath,
        duration,
        filePath,
        tempDir,
        filesToCleanup,
        diarize,
        options
      );
    }

    // Oversized but doesn't need chunking — compress to fit Whisper limit
    if (oversized && duration) {
      if (!tempDir) {
        tempDir = await mkdtemp(join(tmpdir(), "md-video-"));
      }
      return await compressAndTranscribe(
        audioPath,
        audioBuffer,
        filePath,
        tempDir,
        filesToCleanup,
        duration,
        diarize,
        options
      );
    }

    // Small enough for direct transcription
    if (diarize) {
      return await transcribeDiarized(
        audioBuffer,
        filePath,
        basename(audioPath),
        options,
        duration
      );
    }
    return await transcribePlain(audioBuffer, filePath, options, duration);
  } finally {
    for (const f of filesToCleanup) {
      await unlink(f).catch(() => {
        /* cleanup best-effort */
      });
    }
  }
}

async function handleChunkedTranscription(
  audioPath: string,
  duration: number,
  filePath: string,
  tempDir: string,
  filesToCleanup: string[],
  diarize: boolean,
  options: ConversionOptions
): Promise<ConversionResult> {
  if (diarize) {
    const { segments, speakers } = await transcribeChunkedDiarized(
      audioPath,
      duration,
      tempDir,
      filesToCleanup,
      options
    );
    return await formatChunkedDiarizedResult(
      segments,
      speakers,
      filePath,
      options
    );
  }

  const rawText = await transcribeChunkedPlain(
    audioPath,
    duration,
    tempDir,
    filesToCleanup,
    options
  );
  return await formatChunkedPlainResult(rawText, filePath, options);
}
