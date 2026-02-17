import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, experimental_transcribe as transcribe } from "ai";
import { verbose as log } from "../utils/ui.js";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = openai("gpt-5-mini");

const SYSTEM_PROMPT =
  "You are a markdown formatting assistant. Convert the provided raw text into clean, well-structured markdown. Preserve ALL content completely — do not summarize, condense, paraphrase, or omit any text. Every paragraph, sentence, list item, table, figure description, footnote, and reference must appear in the output. Use headings, lists, code blocks, and emphasis where appropriate. Do not add information not present in the source. Output only the markdown, no preamble.";

// ~4 chars per token, conservative estimate
const CHARS_PER_TOKEN = 4;
// gpt-5-mini has 1M+ context. Leave room for system prompt (~300 tokens), user template (~100 tokens), output (16384 tokens)
const MAX_INPUT_CHARS = 250_000 * CHARS_PER_TOKEN;

function splitIntoChunks(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      chunks.push(remaining);
      break;
    }

    // Try to split at a heading boundary
    let splitAt = -1;
    const headingPattern = /\n#{1,6} /g;
    let lastGoodSplit = -1;

    const matches = remaining.matchAll(headingPattern);
    for (const m of matches) {
      if (m.index !== undefined && m.index <= maxChars) {
        lastGoodSplit = m.index;
      } else {
        break;
      }
    }

    if (lastGoodSplit > maxChars * 0.5) {
      splitAt = lastGoodSplit;
    }

    // Fall back to paragraph boundary
    if (splitAt === -1) {
      const paragraphEnd = remaining.lastIndexOf("\n\n", maxChars);
      if (paragraphEnd > maxChars * 0.5) {
        splitAt = paragraphEnd;
      }
    }

    // Fall back to any newline
    if (splitAt === -1) {
      const lineEnd = remaining.lastIndexOf("\n", maxChars);
      if (lineEnd > maxChars * 0.5) {
        splitAt = lineEnd;
      }
    }

    // Hard split as last resort
    if (splitAt === -1) {
      splitAt = maxChars;
    }

    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }

  return chunks;
}

async function formatChunk(
  rawText: string,
  context: { title?: string; source?: string; type: string },
  chunkInfo?: { index: number; total: number },
  isVerbose?: boolean
): Promise<string> {
  const chunkLabel = chunkInfo
    ? `\n\n(Part ${chunkInfo.index + 1} of ${chunkInfo.total})`
    : "";

  if (chunkInfo) {
    log(
      `Formatting chunk ${chunkInfo.index + 1}/${chunkInfo.total} (${rawText.length.toLocaleString()} chars)`,
      isVerbose
    );
  }

  const { text } = await generateText({
    model: MODEL,
    system: SYSTEM_PROMPT,
    prompt: `Convert this ${context.type} content into clean markdown:\n\nTitle: ${context.title ?? "Unknown"}\nSource: ${context.source ?? "Unknown"}${chunkLabel}\n\n---\n\n${rawText}`,
  });

  if (chunkInfo) {
    log(
      `Chunk ${chunkInfo.index + 1} done (${text.length.toLocaleString()} chars output)`,
      isVerbose
    );
  }

  return text;
}

export async function formatAsMarkdown(
  rawText: string,
  context: { title?: string; source?: string; type: string },
  isVerbose?: boolean
): Promise<string> {
  log(
    `AI formatting ${rawText.length.toLocaleString()} chars of ${context.type} content`,
    isVerbose
  );

  const chunks = splitIntoChunks(rawText, MAX_INPUT_CHARS);

  if (chunks.length > 1) {
    log(`Split into ${chunks.length} chunks`, isVerbose);
  }

  if (chunks.length === 1) {
    const result = await formatChunk(rawText, context, undefined, isVerbose);
    log(
      `AI formatting complete (${result.length.toLocaleString()} chars output)`,
      isVerbose
    );
    return result;
  }

  const results = await Promise.all(
    chunks.map((chunk, index) =>
      formatChunk(chunk, context, { index, total: chunks.length }, isVerbose)
    )
  );

  const combined = results.join("\n\n");
  log(
    `AI formatting complete (${combined.length.toLocaleString()} chars output)`,
    isVerbose
  );
  return combined;
}

const IMAGE_SYSTEM_PROMPT = `You are an OCR tool. Your only job is to extract visible text from images and output it as markdown.

Rules:
- Output ONLY the extracted text. Nothing else.
- Use markdown tables for any columnar, grid, or structured data.
- Use headings and lists only when they match the text layout.
- Do NOT describe the image (no colors, fonts, icons, layouts, UI elements).
- Do NOT add commentary, observations, or analysis.
- Do NOT suggest follow-up actions.
- Do NOT wrap output in a top-level heading like "Transcription".
- Be concise. Less is more.`;

export async function describeImage(
  imageData: string | Buffer,
  prompt = "Extract all text from this image as clean markdown. Use a markdown table for any structured or columnar data.",
  isVerbose?: boolean
): Promise<string> {
  const image =
    typeof imageData === "string" ? imageData : imageData.toString("base64");

  const sizeKB = Math.round(
    (typeof imageData === "string"
      ? imageData.length * 0.75
      : imageData.byteLength) / 1024
  );
  log(`Analyzing image (${sizeKB} KB) with vision model`, isVerbose);

  const { text } = await generateText({
    model: MODEL,
    system: IMAGE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image", image },
        ],
      },
    ],
  });

  log(
    `Image analysis complete (${text.length.toLocaleString()} chars output)`,
    isVerbose
  );
  return text;
}

export async function transcribeAudio(
  audioData: Buffer,
  isVerbose?: boolean
): Promise<{
  text: string;
  segments?: Array<{ start: number; text: string }>;
}> {
  const sizeKB = Math.round(audioData.byteLength / 1024);
  log(`Transcribing audio (${sizeKB} KB) with Whisper`, isVerbose);

  const result = await transcribe({
    model: openai.transcription("whisper-1"),
    audio: audioData,
  });

  log(
    `Transcription complete (${result.text.length.toLocaleString()} chars, ${result.segments?.length ?? 0} segments)`,
    isVerbose
  );

  return {
    text: result.text,
    segments: result.segments?.map((s) => ({
      start: s.startSecond,
      text: s.text,
    })),
  };
}

export interface DiarizedSegment {
  end: number;
  speaker: string;
  start: number;
  text: string;
}

export interface DiarizedTranscription {
  segments: DiarizedSegment[];
  speakers: string[];
  text: string;
}

const AUDIO_MIME_TYPES: Record<string, string> = {
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".mp4": "audio/mp4",
  ".mpga": "audio/mpeg",
  ".mpeg": "audio/mpeg",
  ".wav": "audio/wav",
  ".webm": "audio/webm",
};

const MAX_KNOWN_SPEAKERS = 4;

function getAudioUploadMetadata(audioFilename = "audio.mp3"): {
  filename: string;
  mimeType: string;
} {
  const filename = basename(audioFilename);
  const ext = extname(filename).toLowerCase();
  return {
    filename,
    mimeType: AUDIO_MIME_TYPES[ext] ?? "application/octet-stream",
  };
}

function normalizeSpeakerNames(speakerNames?: string[]): string[] {
  return (speakerNames ?? []).map((name) => name.trim()).filter(Boolean);
}

async function toAudioDataUrl(reference: string): Promise<string> {
  const normalized = reference.trim();
  if (!normalized) {
    throw new Error("Speaker reference cannot be empty.");
  }
  if (normalized.startsWith("data:")) {
    return normalized;
  }

  const { mimeType } = getAudioUploadMetadata(normalized);
  if (mimeType === "application/octet-stream") {
    throw new Error(
      `Unsupported speaker reference format: ${normalized}. Use mp3/mp4/mpeg/mpga/m4a/wav/webm files or a data URL.`
    );
  }
  const bytes = await readFile(normalized);
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

function applySpeakerNames(
  segments: DiarizedSegment[],
  speakerNames: string[] | undefined,
  isVerbose?: boolean
): DiarizedSegment[] {
  const normalizedNames = normalizeSpeakerNames(speakerNames);
  if (normalizedNames.length === 0 || segments.length === 0) {
    return segments;
  }

  const detectedSpeakers = [
    ...new Set(segments.map((segment) => segment.speaker)),
  ];
  const speakerMap = new Map<string, string>();

  for (const [index, speaker] of detectedSpeakers.entries()) {
    const customName = normalizedNames[index];
    if (customName) {
      speakerMap.set(speaker, customName);
    }
  }

  if (normalizedNames.length !== detectedSpeakers.length) {
    log(
      `Provided ${normalizedNames.length} speaker names, detected ${detectedSpeakers.length} speakers; unmatched entries keep diarized labels`,
      isVerbose
    );
  }

  return segments.map((segment) => ({
    ...segment,
    speaker: speakerMap.get(segment.speaker) ?? segment.speaker,
  }));
}

export async function transcribeAudioDiarized(
  audioData: Buffer,
  speakers?: string[],
  isVerbose?: boolean,
  audioFilename = "audio.mp3",
  speakerReferences?: string[]
): Promise<DiarizedTranscription> {
  const sizeKB = Math.round(audioData.byteLength / 1024);
  log(
    `Transcribing audio (${sizeKB} KB) with gpt-4o-transcribe-diarize`,
    isVerbose
  );

  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const { filename, mimeType } = getAudioUploadMetadata(audioFilename);
  const file = new File([audioData], filename, { type: mimeType });
  const normalizedSpeakerNames = normalizeSpeakerNames(speakers);
  const normalizedSpeakerReferences = (speakerReferences ?? [])
    .map((reference) => reference.trim())
    .filter(Boolean);

  const params: Record<string, unknown> = {
    file,
    model: "gpt-4o-transcribe-diarize",
    response_format: "diarized_json",
    chunking_strategy: "auto",
  };

  if (normalizedSpeakerReferences.length > 0) {
    if (normalizedSpeakerNames.length === 0) {
      throw new Error(
        "Known speaker references require speaker names. Pass --speakers with matching names."
      );
    }
    if (normalizedSpeakerNames.length !== normalizedSpeakerReferences.length) {
      throw new Error(
        `Expected the same number of speaker names and references, got ${normalizedSpeakerNames.length} names and ${normalizedSpeakerReferences.length} references.`
      );
    }
    if (normalizedSpeakerNames.length > MAX_KNOWN_SPEAKERS) {
      throw new Error(
        `At most ${MAX_KNOWN_SPEAKERS} known speakers are supported for diarization.`
      );
    }

    const dataUrlReferences = await Promise.all(
      normalizedSpeakerReferences.map((reference) => toAudioDataUrl(reference))
    );

    params.extra_body = {
      known_speaker_names: normalizedSpeakerNames,
      known_speaker_references: dataUrlReferences,
    };
    log(
      `Using ${normalizedSpeakerNames.length} known speaker references for diarization`,
      isVerbose
    );
  } else if (normalizedSpeakerNames.length > 0) {
    log(
      "Speaker names provided without references; applying names to diarized labels after transcription",
      isVerbose
    );
  }

  interface DiarizedApiResponse {
    segments: Array<{
      end: number;
      id: string;
      speaker: string;
      start: number;
      text: string;
    }>;
    text: string;
  }
  const response = (await client.audio.transcriptions.create(
    params as unknown as Parameters<
      typeof client.audio.transcriptions.create
    >[0]
  )) as unknown as DiarizedApiResponse;

  const segments: DiarizedSegment[] = (response.segments ?? []).map((s) => ({
    start: s.start,
    end: s.end,
    text: s.text.trim(),
    speaker: s.speaker ?? "Speaker",
  }));

  const labeledSegments =
    normalizedSpeakerNames.length > 0 &&
    normalizedSpeakerReferences.length === 0
      ? applySpeakerNames(segments, normalizedSpeakerNames, isVerbose)
      : segments;
  const uniqueSpeakers = [...new Set(labeledSegments.map((s) => s.speaker))];

  log(
    `Diarized transcription complete (${segments.length} segments, ${uniqueSpeakers.length} speakers)`,
    isVerbose
  );

  return {
    text: response.text ?? segments.map((s) => s.text).join(" "),
    segments: labeledSegments,
    speakers: uniqueSpeakers,
  };
}
