import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { describeImage } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { applyFrontmatter } from "../utils/frontmatter.js";
import { verbose } from "../utils/ui.js";

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
  options: ConversionOptions
): Promise<ConversionResult> {
  const ext = extname(filePath).toLowerCase();
  if (!SUPPORTED.has(ext)) {
    throw new Error(
      `Unsupported image format: ${ext}. Supported: ${[...SUPPORTED].join(", ")}`
    );
  }

  verbose(
    `Reading image: ${filePath} (${getMimeType(filePath)})`,
    options.verbose
  );
  const imageBuffer = await readFile(filePath);
  const filename = basename(filePath);
  verbose(
    `Image size: ${Math.round(imageBuffer.byteLength / 1024)} KB`,
    options.verbose
  );

  const markdown = await describeImage(imageBuffer, undefined, options.verbose);

  const withFrontmatter = applyFrontmatter(markdown, options, {
    title: filename,
    source: filePath,
    type: "image",
    mimeType: getMimeType(filePath),
    fileSize: imageBuffer.byteLength,
  });

  verbose(
    `Final output: ${withFrontmatter.length.toLocaleString()} chars`,
    options.verbose
  );

  return {
    title: filename,
    markdown: withFrontmatter,
    metadata: {
      mimeType: getMimeType(filePath),
      fileSize: imageBuffer.byteLength,
    },
  };
}
