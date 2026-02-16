import { createOpenAI } from "@ai-sdk/openai";
import {
  gateway,
  generateText,
  experimental_transcribe as transcribe,
} from "ai";

const GATEWAY_URL =
  process.env.AI_GATEWAY_URL || "https://ai-gateway.vercel.sh";
const GATEWAY_KEY = process.env.AI_GATEWAY_API_KEY;

const MODEL = gateway("anthropic/claude-sonnet-4-20250514");

// OpenAI provider for transcription (needs explicit config for gateway routing)
const openai = createOpenAI({
  baseURL: `${GATEWAY_URL}/v1`,
  apiKey: GATEWAY_KEY,
});

export async function formatAsMarkdown(
  rawText: string,
  context: { title?: string; source?: string; type: string }
): Promise<string> {
  const { text } = await generateText({
    model: MODEL,
    system:
      "You are a markdown formatting assistant. Convert the provided raw text into clean, well-structured markdown. Use headings, lists, code blocks, and emphasis where appropriate. Preserve all factual content. Do not add information not present in the source. Output only the markdown, no preamble.",
    prompt: `Convert this ${context.type} content into clean markdown:\n\nTitle: ${context.title ?? "Unknown"}\nSource: ${context.source ?? "Unknown"}\n\n---\n\n${rawText}`,
    maxOutputTokens: 8192,
  });
  return text;
}

export async function describeImage(
  imageData: string | Buffer,
  prompt = "Analyze this image thoroughly. If it contains text or documents, transcribe all visible text. If it is a photograph, diagram, or illustration, provide a detailed description. Structure your response as clean markdown with appropriate headings."
): Promise<string> {
  const image =
    typeof imageData === "string" ? imageData : imageData.toString("base64");

  const { text } = await generateText({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image", image },
        ],
      },
    ],
    maxOutputTokens: 4096,
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
