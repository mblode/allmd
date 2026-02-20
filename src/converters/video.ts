import { mkdtemp, readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import extractAudio from "ffmpeg-extract-audio";
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
  extractAudioChunk,
  getAudioDuration,
  isAudioOversized,
  needsChunking,
  WHISPER_MAX_BYTES,
} from "../utils/audio.js";
import { AUDIO_EXTS, VIDEO_EXTS } from "../utils/detect.js";
import { applyFrontmatter } from "../utils/frontmatter.js";
import { verbose } from "../utils/ui.js";

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
  speakerNames: string[],
  speakerReferences: string[],
  options: ConversionOptions
): Promise<ConversionResult> {
  const filename = basename(filePath);
  const transcription = await transcribeAudioDiarized(
    audioBuffer,
    speakerNames,
    options.verbose,
    audioFilename,
    speakerReferences
  );

  const rawText = formatDiarizedSegments(transcription.segments);
  verbose(
    `Transcription: ${rawText.length.toLocaleString()} chars, ${transcription.speakers.length} speakers`,
    options.verbose
  );

  const markdown = await formatAsMarkdown(
    rawText,
    {
      title: filename,
      source: filePath,
      type: "video/audio transcription (diarized)",
    },
    options.verbose
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
  options: ConversionOptions
): Promise<ConversionResult> {
  const filename = basename(filePath);
  const transcription = await transcribeAudio(audioBuffer, options.verbose);
  const rawText = transcription.text;
  verbose(
    `Transcription: ${rawText.length.toLocaleString()} chars`,
    options.verbose
  );

  const markdown = await formatAsMarkdown(
    rawText,
    { title: filename, source: filePath, type: "video/audio transcription" },
    options.verbose
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

  const markdown = await formatAsMarkdown(
    rawText,
    {
      title: filename,
      source: filePath,
      type: "video/audio transcription (diarized)",
    },
    options.verbose
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

  const markdown = await formatAsMarkdown(
    rawText,
    { title: filename, source: filePath, type: "video/audio transcription" },
    options.verbose
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
  speakerNames: string[],
  speakerReferences: string[],
  isVerbose?: boolean
): Promise<{ segments: DiarizedSegment[]; speakers: string[] }> {
  const chunks = calculateChunkBoundaries(duration);
  const bitratePerChunk = calculateTargetBitrate(chunks[0].durationSeconds);

  verbose(
    `Splitting into ${chunks.length} chunks of ~${Math.round(chunks[0].durationSeconds / 60)} min`,
    isVerbose
  );

  const allSegments: DiarizedSegment[] = [];

  for (const chunk of chunks) {
    const chunkPath = join(tempDir, `chunk-${chunk.index}.mp3`);
    filesToCleanup.push(chunkPath);

    verbose(
      `Extracting chunk ${chunk.index + 1}/${chunks.length} (${formatTimestamp(chunk.startSeconds)} – ${formatTimestamp(chunk.startSeconds + chunk.durationSeconds)})`,
      isVerbose
    );

    await extractAudioChunk(
      audioPath,
      chunkPath,
      chunk.startSeconds,
      chunk.durationSeconds,
      bitratePerChunk
    );

    const chunkBuffer = await readFile(chunkPath);
    const transcription = await transcribeAudioDiarized(
      chunkBuffer,
      speakerNames,
      isVerbose,
      `chunk-${chunk.index}.mp3`,
      speakerReferences
    );

    // Offset timestamps by chunk start
    for (const seg of transcription.segments) {
      allSegments.push({
        ...seg,
        start: seg.start + chunk.startSeconds,
        end: seg.end + chunk.startSeconds,
      });
    }
  }

  const dedupedSegments = deduplicateOverlappingSegments(allSegments);
  const uniqueSpeakers = [...new Set(dedupedSegments.map((s) => s.speaker))];

  return { segments: dedupedSegments, speakers: uniqueSpeakers };
}

async function transcribeChunkedPlain(
  audioPath: string,
  duration: number,
  tempDir: string,
  filesToCleanup: string[],
  isVerbose?: boolean
): Promise<string> {
  const chunks = calculateChunkBoundaries(duration);
  const bitratePerChunk = calculateTargetBitrate(chunks[0].durationSeconds);

  verbose(
    `Splitting into ${chunks.length} chunks of ~${Math.round(chunks[0].durationSeconds / 60)} min`,
    isVerbose
  );

  const textParts: string[] = [];

  for (const chunk of chunks) {
    const chunkPath = join(tempDir, `chunk-${chunk.index}.mp3`);
    filesToCleanup.push(chunkPath);

    verbose(
      `Extracting chunk ${chunk.index + 1}/${chunks.length} (${formatTimestamp(chunk.startSeconds)} – ${formatTimestamp(chunk.startSeconds + chunk.durationSeconds)})`,
      isVerbose
    );

    await extractAudioChunk(
      audioPath,
      chunkPath,
      chunk.startSeconds,
      chunk.durationSeconds,
      bitratePerChunk
    );

    const chunkBuffer = await readFile(chunkPath);
    const transcription = await transcribeAudio(chunkBuffer, isVerbose);
    textParts.push(transcription.text);
  }

  return textParts.join(" ");
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

export async function convertVideo(
  filePath: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  const { isAudio, isVideo, speakerNames, speakerReferences, diarize } =
    parseVideoOptions(filePath, options);

  const ext = extname(filePath).toLowerCase();
  let audioPath: string;
  let tempDir: string | undefined;
  const filesToCleanup: string[] = [];
  const shouldTranscodeForDiarization =
    diarize && isAudio && !DIARIZE_ACCEPTED_AUDIO_EXTS.has(ext);

  if (isVideo || shouldTranscodeForDiarization) {
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
    verbose(
      `Audio size: ${Math.round(audioBuffer.byteLength / 1024)} KB`,
      options.verbose
    );

    if (isAudioOversized(audioBuffer)) {
      return await handleOversizedAudio(
        audioPath,
        audioBuffer,
        filePath,
        tempDir,
        filesToCleanup,
        diarize,
        speakerNames,
        speakerReferences,
        options
      );
    }

    if (diarize) {
      return await transcribeDiarized(
        audioBuffer,
        filePath,
        basename(audioPath),
        speakerNames,
        speakerReferences,
        options
      );
    }
    return await transcribePlain(audioBuffer, filePath, options);
  } finally {
    for (const f of filesToCleanup) {
      await unlink(f).catch(() => {
        /* cleanup best-effort */
      });
    }
  }
}

async function handleOversizedAudio(
  audioPath: string,
  audioBuffer: Buffer,
  filePath: string,
  existingTempDir: string | undefined,
  filesToCleanup: string[],
  diarize: boolean,
  speakerNames: string[],
  speakerReferences: string[],
  options: ConversionOptions
): Promise<ConversionResult> {
  const duration = await getAudioDuration(audioPath);
  verbose(`Audio duration: ${Math.round(duration)}s`, options.verbose);

  const tempDir =
    existingTempDir ?? (await mkdtemp(join(tmpdir(), "md-video-")));

  if (needsChunking(duration)) {
    return await handleChunkedTranscription(
      audioPath,
      duration,
      filePath,
      tempDir,
      filesToCleanup,
      diarize,
      speakerNames,
      speakerReferences,
      options
    );
  }

  // Fits in one file after compression
  verbose(
    `Audio exceeds Whisper limit (${Math.round(audioBuffer.byteLength / 1024 / 1024)} MB). Compressing...`,
    options.verbose
  );

  const targetBitrate = calculateTargetBitrate(duration);
  verbose(`Compressing to ${targetBitrate}kbps mono 16kHz`, options.verbose);

  const compressedPath = join(tempDir, "compressed.mp3");
  filesToCleanup.push(compressedPath);
  await compressAudio(audioPath, compressedPath, targetBitrate);

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
      speakerNames,
      speakerReferences,
      options
    );
  }
  return await transcribePlain(compressedBuffer, filePath, options);
}

async function handleChunkedTranscription(
  audioPath: string,
  duration: number,
  filePath: string,
  tempDir: string,
  filesToCleanup: string[],
  diarize: boolean,
  speakerNames: string[],
  speakerReferences: string[],
  options: ConversionOptions
): Promise<ConversionResult> {
  if (diarize) {
    const { segments, speakers } = await transcribeChunkedDiarized(
      audioPath,
      duration,
      tempDir,
      filesToCleanup,
      speakerNames,
      speakerReferences,
      options.verbose
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
    options.verbose
  );
  return await formatChunkedPlainResult(rawText, filePath, options);
}
