import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { formatAsMarkdown } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { addFrontmatter } from "../utils/frontmatter.js";

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

  if (!(article && article.content)) {
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
  _options: ConversionOptions
): Promise<ConversionResult> {
  const article = await extractReadableContent(url);
  const rawMarkdown = htmlToMarkdown(article.content);

  const markdown = await formatAsMarkdown(rawMarkdown, {
    title: article.title,
    source: url,
    type: "web article",
  });

  const withFrontmatter = addFrontmatter(markdown, {
    title: article.title,
    source: url,
    date: new Date().toISOString(),
    type: "web",
    excerpt: article.excerpt,
    siteName: article.siteName,
  });

  return {
    title: article.title,
    markdown: withFrontmatter,
    rawContent: article.content,
    metadata: { excerpt: article.excerpt, siteName: article.siteName },
  };
}
