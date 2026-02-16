import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import pdfParse from "pdf-parse";
import { formatAsMarkdown } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { addFrontmatter } from "../utils/frontmatter.js";
import { verbose } from "../utils/ui.js";

export async function convertPdf(
  filePath: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  verbose(`Reading PDF: ${filePath}`, options.verbose);
  const buffer = await readFile(filePath);
  const filename = basename(filePath);
  verbose(
    `PDF size: ${Math.round(buffer.byteLength / 1024)} KB`,
    options.verbose
  );

  const parsed = await pdfParse(buffer);
  verbose(
    `Parsed ${parsed.numpages} pages, ${parsed.text.length.toLocaleString()} chars extracted`,
    options.verbose
  );

  const hasText = parsed.text.trim().length > 100;

  let markdown: string;
  let title = filename;

  if (hasText) {
    markdown = await formatAsMarkdown(
      parsed.text,
      {
        title: filename,
        source: filePath,
        type: "PDF document",
      },
      options.verbose
    );
  } else {
    verbose(
      "PDF appears to be scanned/image-based, skipping AI formatting",
      options.verbose
    );
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

  verbose(
    `Final output: ${withFrontmatter.length.toLocaleString()} chars`,
    options.verbose
  );

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
