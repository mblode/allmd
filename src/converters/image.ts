import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { describeImage } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { addFrontmatter } from "../utils/frontmatter.js";

const SUPPORTED = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return types[ext] ?? "image/png";
}

export async function convertImage(
  filePath: string,
  _options: ConversionOptions
): Promise<ConversionResult> {
  const ext = extname(filePath).toLowerCase();
  if (!SUPPORTED.has(ext)) {
    throw new Error(
      `Unsupported image format: ${ext}. Supported: ${[...SUPPORTED].join(", ")}`
    );
  }

  const imageBuffer = await readFile(filePath);
  const filename = basename(filePath);

  const markdown = await describeImage(imageBuffer);

  const withFrontmatter = addFrontmatter(markdown, {
    title: filename,
    source: filePath,
    date: new Date().toISOString(),
    type: "image",
    mimeType: getMimeType(filePath),
    fileSize: imageBuffer.byteLength,
  });

  return {
    title: filename,
    markdown: withFrontmatter,
    metadata: {
      mimeType: getMimeType(filePath),
      fileSize: imageBuffer.byteLength,
    },
  };
}
