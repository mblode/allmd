import { createOpenAI } from "@ai-sdk/openai";
import { generateText, experimental_transcribe as transcribe } from "ai";

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
  chunkInfo?: { index: number; total: number }
): Promise<string> {
  const chunkLabel = chunkInfo
    ? `\n\n(Part ${chunkInfo.index + 1} of ${chunkInfo.total})`
    : "";

  const { text } = await generateText({
    model: MODEL,
    system: SYSTEM_PROMPT,
    prompt: `Convert this ${context.type} content into clean markdown:\n\nTitle: ${context.title ?? "Unknown"}\nSource: ${context.source ?? "Unknown"}${chunkLabel}\n\n---\n\n${rawText}`,
  });
  return text;
}

export async function formatAsMarkdown(
  rawText: string,
  context: { title?: string; source?: string; type: string }
): Promise<string> {
  const chunks = splitIntoChunks(rawText, MAX_INPUT_CHARS);

  if (chunks.length === 1) {
    return formatChunk(rawText, context);
  }

  const results = await Promise.all(
    chunks.map((chunk, index) =>
      formatChunk(chunk, context, { index, total: chunks.length })
    )
  );

  return results.join("\n\n");
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
  prompt = "Extract all text from this image as clean markdown. Use a markdown table for any structured or columnar data."
): Promise<string> {
  const image =
    typeof imageData === "string" ? imageData : imageData.toString("base64");

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
    temperature: 0,
  });
  return text;
}

export async function transcribeAudio(audioData: Buffer): Promise<{
  text: string;
  segments?: Array<{ start: number; text: string }>;
}> {
  const result = await transcribe({
    model: openai.transcription("whisper-1"),
    audio: audioData,
  });
  return {
    text: result.text,
    segments: result.segments?.map((s) => ({
      start: s.startSecond,
      text: s.text,
    })),
  };
}
