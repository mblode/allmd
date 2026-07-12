import EPub from "epub2";

import { formatAsMarkdown } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { applyFrontmatter } from "../utils/frontmatter.js";
import { htmlToMarkdown } from "../utils/html.js";
import { titleFromFilename } from "../utils/slug.js";
import { trackProgress, verbose } from "../utils/ui.js";

// epub2 default export is the namespace in ESM; the class is on .EPub
const mod = EPub as unknown as Record<string, typeof EPub>;
const EPubClass = mod.EPub ?? mod.default ?? EPub;

export async function convertEpub(
  filePath: string,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  verbose(`Reading EPUB: ${filePath}`, options.verbose);

  let epub: EPub;
  try {
    epub = await EPubClass.createAsync(filePath);
  } catch (error) {
    throw new Error(
      `Failed to parse EPUB file: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }

  const title = epub.metadata?.title ?? titleFromFilename(filePath);
  const author = epub.metadata?.creator ?? "";

  verbose(
    `EPUB: "${title}" by ${author || "unknown"}, ${epub.flow.length} chapters`,
    options.verbose
  );

  const chapterTexts: string[] = [];

  for (const chapter of epub.flow) {
    if (!chapter.id) {
      continue;
    }
    try {
      options.onProgress?.(`Extracting chapter ${chapterTexts.length + 1}...`);
      const html = await epub.getChapterAsync(chapter.id);
      const md = htmlToMarkdown(html);
      if (md.trim()) {
        const heading = chapter.title ? `## ${chapter.title}\n\n` : "";
        chapterTexts.push(heading + md);
      }
    } catch {
      verbose(
        `Skipping chapter ${chapter.id}: could not read`,
        options.verbose
      );
    }
  }

  const rawMarkdown = chapterTexts.join("\n\n---\n\n");
  verbose(
    `Extracted ${rawMarkdown.length.toLocaleString()} chars raw markdown`,
    options.verbose
  );

  const markdown =
    options.ai === false
      ? rawMarkdown
      : await trackProgress(
          options.onProgress,
          "Formatting with AI...",
          formatAsMarkdown(
            rawMarkdown,
            {
              source: filePath,
              title,
              type: "EPUB ebook",
            },
            options
          )
        );

  const withFrontmatter = applyFrontmatter(markdown, options, {
    author: author || undefined,
    chapters: epub.flow.length,
    source: filePath,
    title,
    type: "epub",
  });

  verbose(
    `Final output: ${withFrontmatter.length.toLocaleString()} chars`,
    options.verbose
  );

  return {
    markdown: withFrontmatter,
    metadata: {
      author,
      chapters: epub.flow.length,
      language: epub.metadata?.language,
      publisher: epub.metadata?.publisher,
    },
    rawContent: rawMarkdown,
    title,
  };
}
