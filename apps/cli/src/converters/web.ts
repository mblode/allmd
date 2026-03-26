import type { ConversionOptions, ConversionResult } from "../types.js";
import { scrapeMarkdownWithFirecrawl } from "../utils/firecrawl.js";
import { applyFrontmatter } from "../utils/frontmatter.js";
import { verbose } from "../utils/ui.js";

export async function convertWeb(
  url: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  verbose(`Fetching ${url}`, options.verbose);

  options.onProgress?.("Rendering with Firecrawl...");
  const article = await scrapeMarkdownWithFirecrawl(url, {
    abortSignal: options.abortSignal,
    verbose: options.verbose,
  });
  verbose(`Extracted "${article.title}" via Firecrawl`, options.verbose);

  options.onProgress?.("Applying frontmatter...");
  const withFrontmatter = applyFrontmatter(article.content, options, {
    title: article.title,
    source: url,
    type: "web",
    excerpt: article.excerpt,
    siteName: article.siteName,
  });

  verbose(
    `Final output: ${withFrontmatter.length.toLocaleString()} chars`,
    options.verbose
  );

  return {
    title: article.title,
    markdown: withFrontmatter,
    rawContent: article.content,
    metadata: {
      excerpt: article.excerpt,
      provider: "firecrawl",
      siteName: article.siteName,
    },
  };
}
