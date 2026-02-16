import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { formatAsMarkdown } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { addFrontmatter } from "../utils/frontmatter.js";
import { verbose } from "../utils/ui.js";

function createTurndown(): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  td.use(gfm);
  return td;
}

export function htmlToMarkdown(html: string): string {
  return createTurndown().turndown(html);
}

export async function extractReadableContent(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`
    );
  }
  const html = await response.text();
  const { document } = parseHTML(html);
  const reader = new Readability(document);
  const article = reader.parse();

  if (!article?.content) {
    throw new Error(`Could not extract readable content from ${url}`);
  }

  return {
    title: article.title ?? "",
    content: article.content,
    excerpt: article.excerpt ?? "",
    siteName: article.siteName ?? "",
  };
}

export async function convertWeb(
  url: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  verbose(`Fetching ${url}`, options.verbose);
  const article = await extractReadableContent(url);
  verbose(
    `Extracted "${article.title}" (${article.content.length.toLocaleString()} chars HTML)`,
    options.verbose
  );

  const rawMarkdown = htmlToMarkdown(article.content);
  verbose(
    `Converted to ${rawMarkdown.length.toLocaleString()} chars raw markdown`,
    options.verbose
  );

  const markdown = await formatAsMarkdown(
    rawMarkdown,
    {
      title: article.title,
      source: url,
      type: "web article",
    },
    options.verbose
  );

  const withFrontmatter = addFrontmatter(markdown, {
    title: article.title,
    source: url,
    date: new Date().toISOString(),
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
    metadata: { excerpt: article.excerpt, siteName: article.siteName },
  };
}
