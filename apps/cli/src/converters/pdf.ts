import { readFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";
import { formatAsMarkdown } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { applyFrontmatter } from "../utils/frontmatter.js";
import { titleFromFilename } from "../utils/slug.js";
import { trackProgress, verbose } from "../utils/ui.js";

export async function convertPdf(
  filePath: string,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  verbose(`Reading PDF: ${filePath}`, options.verbose);
  options.onProgress?.("Parsing PDF...");
  const buffer = await readFile(filePath);
  const filename = titleFromFilename(filePath);
  verbose(
    `PDF size: ${Math.round(buffer.byteLength / 1024)} KB`,
    options.verbose
  );

  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  let text: string;
  let numpages: number;
  let info: Record<string, unknown>;
  try {
    const parsed = await parser.getText({ pageJoiner: "" });
    text = parsed.text;
    numpages = parsed.total;
    ({ info } = await parser.getInfo());
  } finally {
    await parser.destroy();
  }
  verbose(
    `Parsed ${numpages} pages, ${text.length.toLocaleString()} chars extracted`,
    options.verbose
  );

  const hasText = text.trim().length > 100;

  let markdown: string;
  let title = filename;

  if (options.ai === false) {
    verbose("Skipping AI formatting (--no-ai)", options.verbose);
    markdown = text;
  } else if (hasText) {
    markdown = await trackProgress(
      options.onProgress,
      "Formatting with AI...",
      formatAsMarkdown(
        text,
        {
          title: filename,
          source: filePath,
          type: "PDF document",
        },
        options
      )
    );
  } else {
    verbose(
      "PDF appears to be scanned/image-based, skipping AI formatting",
      options.verbose
    );
    markdown =
      `# ${filename}\n\n` +
      "> This PDF appears to be scanned/image-based. Text extraction may be incomplete.\n\n" +
      text;
  }

  if (info?.Title && typeof info.Title === "string") {
    title = info.Title;
  }

  const withFrontmatter = applyFrontmatter(markdown, options, {
    title,
    source: filePath,
    type: "pdf",
    pages: numpages,
  });

  verbose(
    `Final output: ${withFrontmatter.length.toLocaleString()} chars`,
    options.verbose
  );

  return {
    title,
    markdown: withFrontmatter,
    rawContent: text,
    metadata: {
      pages: numpages,
      info,
    },
  };
}
