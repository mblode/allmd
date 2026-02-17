import { existsSync } from "node:fs";
import { extname } from "node:path";

const VIDEO_ID_PATTERNS = [
  /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
  /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
];

const GDOC_ID_RE = /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/;
const WWW_PREFIX_RE = /^www\./;

export const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);
export const VIDEO_EXTS = new Set([
  ".mp4",
  ".mkv",
  ".avi",
  ".mov",
  ".webm",
  ".flv",
  ".wmv",
  ".m4v",
]);
export const AUDIO_EXTS = new Set([
  ".mp3",
  ".wav",
  ".m4a",
  ".ogg",
  ".flac",
  ".aac",
  ".wma",
]);

export type InputType = "url" | "file" | "unknown";
export type URLType = "youtube" | "gdoc" | "tweet" | "rss" | "web";
export type FileType =
  | "pdf"
  | "image"
  | "video"
  | "audio"
  | "docx"
  | "epub"
  | "csv"
  | "pptx"
  | "unknown";

export function classifyInput(input: string): { type: InputType } {
  if (!input?.trim()) {
    return { type: "unknown" };
  }

  const trimmed = input.trim();

  if (URL.canParse(trimmed)) {
    return { type: "url" };
  }

  if (existsSync(trimmed)) {
    return { type: "file" };
  }

  return { type: "unknown" };
}

export function classifyURL(url: string): URLType {
  for (const pattern of VIDEO_ID_PATTERNS) {
    if (pattern.test(url)) {
      return "youtube";
    }
  }

  if (GDOC_ID_RE.test(url)) {
    return "gdoc";
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(WWW_PREFIX_RE, "");

    if (hostname === "twitter.com" || hostname === "x.com") {
      return "tweet";
    }

    const path = parsed.pathname.toLowerCase();
    if (
      path.includes("/feed") ||
      path.includes("/rss") ||
      path.endsWith(".xml") ||
      path.endsWith(".atom")
    ) {
      return "rss";
    }
  } catch {
    // Fall through to default
  }

  return "web";
}

export function classifyFile(filePath: string): FileType {
  const ext = extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    return "pdf";
  }
  if (IMAGE_EXTS.has(ext)) {
    return "image";
  }
  if (VIDEO_EXTS.has(ext)) {
    return "video";
  }
  if (AUDIO_EXTS.has(ext)) {
    return "audio";
  }
  if (ext === ".docx" || ext === ".doc") {
    return "docx";
  }
  if (ext === ".epub") {
    return "epub";
  }
  if (ext === ".csv" || ext === ".tsv") {
    return "csv";
  }
  if (ext === ".pptx") {
    return "pptx";
  }

  return "unknown";
}
