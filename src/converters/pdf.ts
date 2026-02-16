import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import pdfParse from "pdf-parse";
import { formatAsMarkdown } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { addFrontmatter } from "../utils/frontmatter.js";

export async function convertPdf(
  filePath: string,
  _options: ConversionOptions
): Promise<ConversionResult> {
  const buffer = await readFile(filePath);
  const filename = basename(filePath);
  const parsed = await pdfParse(buffer);

  const hasText = parsed.text.trim().length > 100;

  let markdown: string;
  let title = filename;

  if (hasText) {
    markdown = await formatAsMarkdown(parsed.text, {
      title: filename,
      source: filePath,
      type: "PDF document",
    });
  } else {
    markdown =
      `# ${filename}\n\n` +
      "> This PDF appears to be scanned/image-based. Text extraction may be incomplete.\n\n" +
      parsed.text;
  }

  if (parsed.info?.Title) {
    title = parsed.info.Title;
  }

  const withFrontmatter = addFrontmatter(markdown, {
    title,
    source: filePath,
    date: new Date().toISOString(),
    type: "pdf",
    pages: parsed.numpages,
  });

  return {
    title,
    markdown: withFrontmatter,
    rawContent: parsed.text,
    metadata: {
      pages: parsed.numpages,
      info: parsed.info,
    },
  };
}
