import { readFile } from "node:fs/promises";
import mammoth from "mammoth";
import { formatAsMarkdown } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { applyFrontmatter } from "../utils/frontmatter.js";
import { titleFromFilename } from "../utils/slug.js";
import { verbose } from "../utils/ui.js";
import { htmlToMarkdown } from "./web.js";

export async function convertDocx(
  filePath: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  verbose(`Reading DOCX: ${filePath}`, options.verbose);
  const buffer = await readFile(filePath);
  verbose(
    `DOCX size: ${Math.round(buffer.byteLength / 1024)} KB`,
    options.verbose
  );

  const result = await mammoth.convertToHtml({ buffer });
  verbose(
    `Extracted ${result.value.length.toLocaleString()} chars HTML`,
    options.verbose
  );

  if (result.messages.length > 0) {
    for (const msg of result.messages) {
      verbose(`mammoth ${msg.type}: ${msg.message}`, options.verbose);
    }
  }

  const rawMarkdown = htmlToMarkdown(result.value);
  verbose(
    `Converted to ${rawMarkdown.length.toLocaleString()} chars raw markdown`,
    options.verbose
  );

  const markdown = await formatAsMarkdown(
    rawMarkdown,
    {
      title: titleFromFilename(filePath),
      source: filePath,
      type: "Word document",
    },
    options.verbose
  );

  const title = titleFromFilename(filePath);

  const withFrontmatter = applyFrontmatter(markdown, options, {
    title,
    source: filePath,
    type: "docx",
  });

  verbose(
    `Final output: ${withFrontmatter.length.toLocaleString()} chars`,
    options.verbose
  );

  return {
    title,
    markdown: withFrontmatter,
    rawContent: result.value,
    metadata: {},
  };
}
