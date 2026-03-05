import { FirecrawlAppV1 as FirecrawlApp } from "@mendable/firecrawl-js";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { formatAsMarkdown } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { fetchWithTimeout } from "../utils/fetch.js";
import { applyFrontmatter } from "../utils/frontmatter.js";
import { verbose, warn } from "../utils/ui.js";

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

export async function extractReadableContent(url: string, isVerbose?: boolean) {
  verbose(`Opening connection to ${url}`, isVerbose);
  const response = await fetchWithTimeout(url);
  verbose(`Response received: HTTP ${response.status}`, isVerbose);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`
    );
  }
  const html = await response.text();
  verbose(
    `Downloaded ${html.length.toLocaleString()} bytes of HTML`,
    isVerbose
  );
  const { document } = parseHTML(html);
  verbose("Parsing article content...", isVerbose);
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

async function fetchWithFirecrawl(url: string, isVerbose?: boolean) {
  verbose("Using Firecrawl (JS rendering enabled)...", isVerbose);
  const apiKey = process.env.FIRECRAWL_API_KEY ?? "";
  const app = new FirecrawlApp({ apiKey });
  const result = await app.scrapeUrl(url, { formats: ["markdown"] });
  if (!result.success) {
    throw new Error(
      `Firecrawl failed: ${"error" in result ? result.error : "unknown error"}`
    );
  }
  const markdown = "markdown" in result ? result.markdown : undefined;
  const metadata = "metadata" in result ? result.metadata : undefined;
  verbose(
    `Firecrawl response: ${(markdown ?? "").length.toLocaleString()} chars markdown`,
    isVerbose
  );
  return {
    title: metadata?.title ?? "",
    content: markdown ?? "",
    excerpt: metadata?.description ?? "",
    siteName: metadata?.sourceURL ?? url,
    isMarkdown: true,
  };
}

export async function convertWeb(
  url: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  verbose(`Fetching ${url}`, options.verbose);

  let rawMarkdown: string;
  let articleMeta: { title: string; excerpt: string; siteName: string };

  if (process.env.FIRECRAWL_API_KEY) {
    try {
      const fc = await fetchWithFirecrawl(url, options.verbose);
      verbose(`Extracted "${fc.title}" via Firecrawl`, options.verbose);
      rawMarkdown = fc.content;
      articleMeta = {
        title: fc.title,
        excerpt: fc.excerpt,
        siteName: fc.siteName,
      };
    } catch (err) {
      warn(
        `Firecrawl failed (${err instanceof Error ? err.message : String(err)}), falling back to direct fetch...`
      );
      const article = await extractReadableContent(url, options.verbose);
      rawMarkdown = htmlToMarkdown(article.content);
      verbose(
        `Converted to ${rawMarkdown.length.toLocaleString()} chars raw markdown`,
        options.verbose
      );
      articleMeta = article;
    }
  } else {
    const article = await extractReadableContent(url, options.verbose);
    verbose(
      `Extracted "${article.title}" (${article.content.length.toLocaleString()} chars HTML)`,
      options.verbose
    );
    rawMarkdown = htmlToMarkdown(article.content);
    verbose(
      `Converted to ${rawMarkdown.length.toLocaleString()} chars raw markdown`,
      options.verbose
    );
    articleMeta = article;
  }

  verbose("Formatting with AI...", options.verbose);
  const markdown = await formatAsMarkdown(
    rawMarkdown,
    {
      title: articleMeta.title,
      source: url,
      type: "web article",
    },
    options.verbose
  );

  const withFrontmatter = applyFrontmatter(markdown, options, {
    title: articleMeta.title,
    source: url,
    type: "web",
    excerpt: articleMeta.excerpt,
    siteName: articleMeta.siteName,
  });

  verbose(
    `Final output: ${withFrontmatter.length.toLocaleString()} chars`,
    options.verbose
  );

  return {
    title: articleMeta.title,
    markdown: withFrontmatter,
    rawContent: rawMarkdown,
    metadata: { excerpt: articleMeta.excerpt, siteName: articleMeta.siteName },
  };
}
