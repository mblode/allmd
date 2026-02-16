import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { formatAsMarkdown } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { addFrontmatter } from "../utils/frontmatter.js";
import { htmlToMarkdown } from "./web.js";

export function extractDocId(url: string): string {
  const match = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) {
    throw new Error(`Could not extract document ID from URL: ${url}`);
  }
  return match[1];
}

export async function convertGdoc(
  url: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  const docId = extractDocId(url);
  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=html`;

  const response = await fetch(exportUrl);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        'Google Doc not found. Make sure the document is publicly accessible (shared with "Anyone with the link").'
      );
    }
    throw new Error(
      `Failed to export Google Doc: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();
  let markdown: string;
  let title = "Untitled Google Doc";

  try {
    const { document } = parseHTML(html);
    const titleEl = document.querySelector("title");
    if (titleEl?.textContent) {
      title = titleEl.textContent;
    }

    const reader = new Readability(document);
    const article = reader.parse();

    if (article?.content) {
      markdown = htmlToMarkdown(article.content);
      if (article.title) {
        title = article.title;
      }
    } else {
      markdown = htmlToMarkdown(html);
    }
  } catch {
    markdown = htmlToMarkdown(html);
  }

  if (options.ai) {
    markdown = await formatAsMarkdown(markdown, {
      title,
      source: url,
      type: "Google Docs document",
    });
  }

  const withFrontmatter = addFrontmatter(markdown, {
    title,
    source: url,
    date: new Date().toISOString(),
    type: "gdoc",
    docId,
  });

  return {
    title,
    markdown: withFrontmatter,
    rawContent: html,
    metadata: { docId },
  };
}
