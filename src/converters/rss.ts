import RssParser from "rss-parser";
import { formatAsMarkdown } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { applyFrontmatter } from "../utils/frontmatter.js";
import { verbose } from "../utils/ui.js";
import { htmlToMarkdown } from "./web.js";

interface RssItem {
  categories?: string[];
  content?: string;
  contentSnippet?: string;
  creator?: string;
  isoDate?: string;
  link?: string;
  pubDate?: string;
  summary?: string;
  title?: string;
}

function escapeMarkdownLink(url: string): string {
  return url.replace(/\]/g, "%5D").replace(/\)/g, "%29");
}

function formatItemMeta(item: RssItem): string[] {
  const meta: string[] = [];
  if (item.creator) {
    meta.push(`By ${item.creator}`);
  }
  if (item.isoDate) {
    meta.push(new Date(item.isoDate).toLocaleDateString());
  } else if (item.pubDate) {
    meta.push(item.pubDate);
  }
  if (item.link) {
    meta.push(`[Link](${escapeMarkdownLink(item.link)})`);
  }
  return meta;
}

function formatItem(item: RssItem): string {
  const parts: string[] = [];

  parts.push(`## ${item.title ?? "Untitled"}`);

  const meta = formatItemMeta(item);
  if (meta.length > 0) {
    parts.push(`*${meta.join(" | ")}*`);
  }

  if (item.content) {
    parts.push(htmlToMarkdown(item.content));
  } else if (item.contentSnippet) {
    parts.push(item.contentSnippet);
  } else if (item.summary) {
    parts.push(item.summary);
  }

  if (item.categories && item.categories.length > 0) {
    parts.push(`Tags: ${item.categories.join(", ")}`);
  }

  return parts.join("\n\n");
}

export async function convertRss(
  url: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  verbose(`Fetching RSS feed: ${url}`, options.verbose);

  const parser = new RssParser();
  const feed = await parser.parseURL(url);

  verbose(
    `Feed: "${feed.title}" - ${feed.items.length} items`,
    options.verbose
  );

  const sections: string[] = [];

  if (feed.description) {
    sections.push(`> ${feed.description}`);
  }

  for (const item of feed.items) {
    sections.push(formatItem(item));
  }

  const rawMarkdown = sections.join("\n\n---\n\n");
  verbose(
    `Extracted ${rawMarkdown.length.toLocaleString()} chars raw markdown`,
    options.verbose
  );

  const markdown = await formatAsMarkdown(
    rawMarkdown,
    {
      title: feed.title ?? "RSS Feed",
      source: url,
      type: "RSS feed",
    },
    options.verbose
  );

  const title = feed.title ?? "RSS Feed";

  const withFrontmatter = applyFrontmatter(markdown, options, {
    title,
    source: url,
    type: "rss",
    items: feed.items.length,
    feedUrl: feed.feedUrl ?? url,
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
      feedTitle: feed.title,
      feedDescription: feed.description,
      feedUrl: feed.feedUrl,
      itemCount: feed.items.length,
    },
  };
}
