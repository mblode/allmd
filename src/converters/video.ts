import { mkdtemp, readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import extractAudio from "ffmpeg-extract-audio";
import { formatAsMarkdown, transcribeAudio } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { AUDIO_EXTS, VIDEO_EXTS } from "../utils/detect.js";
import { applyFrontmatter } from "../utils/frontmatter.js";
import { verbose } from "../utils/ui.js";

export async function convertVideo(
  filePath: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  const ext = extname(filePath).toLowerCase();
  const isAudio = AUDIO_EXTS.has(ext);
  const isVideo = VIDEO_EXTS.has(ext);

  if (!(isAudio || isVideo)) {
    throw new Error(
      `Unsupported format: ${ext}. Supported video: ${[...VIDEO_EXTS].join(", ")}. Audio: ${[...AUDIO_EXTS].join(", ")}`
    );
  }

  verbose(
    `Processing ${isVideo ? "video" : "audio"} file: ${filePath}`,
    options.verbose
  );

  let audioPath: string;
  let tempDir: string | undefined;

  if (isVideo) {
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

    const transcription = await transcribeAudio(audioBuffer, options.verbose);

    const rawText = transcription.text;
    const filename = basename(filePath);
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
