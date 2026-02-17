import EPub from "epub2";
import { formatAsMarkdown } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { applyFrontmatter } from "../utils/frontmatter.js";
import { titleFromFilename } from "../utils/slug.js";
import { verbose } from "../utils/ui.js";
import { htmlToMarkdown } from "./web.js";

// epub2 default export is the namespace in ESM; the class is on .EPub
const mod = EPub as unknown as Record<string, typeof EPub>;
const EPubClass = mod.EPub ?? mod.default ?? EPub;

export async function convertEpub(
  filePath: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  verbose(`Reading EPUB: ${filePath}`, options.verbose);

  let epub: EPub;
  try {
    epub = await EPubClass.createAsync(filePath);
  } catch (err) {
    throw new Error(
      `Failed to parse EPUB file: ${err instanceof Error ? err.message : String(err)}`
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

  const markdown = await formatAsMarkdown(
    rawMarkdown,
    {
      title,
      source: filePath,
      type: "EPUB ebook",
    },
    options.verbose
  );

  const withFrontmatter = applyFrontmatter(markdown, options, {
    title,
    source: filePath,
    type: "epub",
    author: author || undefined,
    chapters: epub.flow.length,
  });

  verbose(
    `Final output: ${withFrontmatter.length.toLocaleString()} chars`,
    options.verbose
  );

  return {
    title,
    markdown: withFrontmatter,
    rawContent: rawMarkdown,
    metadata: {
      author,
      chapters: epub.flow.length,
      publisher: epub.metadata?.publisher,
      language: epub.metadata?.language,
    },
  };
}
