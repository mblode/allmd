import { mkdtemp, readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import extractAudio from "ffmpeg-extract-audio";
import {
  formatAsMarkdown,
  transcribeAudio,
  transcribeAudioDiarized,
} from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
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

export async function convertVideo(
  filePath: string,
  options: ConversionOptions
): Promise<ConversionResult> {
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

  let audioPath: string;
  let tempDir: string | undefined;
  const shouldTranscodeForDiarization =
    diarize && isAudio && !DIARIZE_ACCEPTED_AUDIO_EXTS.has(ext);

  if (isVideo || shouldTranscodeForDiarization) {
    verbose("Extracting audio track with ffmpeg...", options.verbose);
    tempDir = await mkdtemp(join(tmpdir(), "md-video-"));
    audioPath = join(tempDir, "audio.mp3");
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

    const filename = basename(filePath);

    if (diarize) {
      const transcription = await transcribeAudioDiarized(
        audioBuffer,
        speakerNames,
        options.verbose,
        basename(audioPath),
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

    const transcription = await transcribeAudio(audioBuffer, options.verbose);

    const rawText = transcription.text;
    verbose(
      `Transcription: ${rawText.length.toLocaleString()} chars`,
      options.verbose
    );

    const markdown = await formatAsMarkdown(
      rawText,
      {
        title: filename,
        source: filePath,
        type: "video/audio transcription",
      },
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
  } finally {
    if (tempDir) {
      await unlink(audioPath).catch(() => {
        /* cleanup best-effort */
      });
    }
  }
}
