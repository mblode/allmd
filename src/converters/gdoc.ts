import { parseHTML } from "linkedom";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { formatAsMarkdown } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { addFrontmatter } from "../utils/frontmatter.js";

const GDOC_ID_RE = /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/;

export function extractDocId(url: string): string {
  const match = url.match(GDOC_ID_RE);
  if (!match) {
    throw new Error(`Could not extract document ID from URL: ${url}`);
  }
  return match[1];
}

/**
 * Clean Google Docs HTML in-place: strip styles, base64 images, and empty spans.
 */
function preprocessGdocHtml(
  document: ReturnType<typeof parseHTML>["document"]
): void {
  // Remove all <style> elements
  for (const style of document.querySelectorAll("style")) {
    style.remove();
  }

  // Replace base64 data URI images with [image] placeholder
  for (const img of document.querySelectorAll("img")) {
    const src = img.getAttribute("src") ?? "";
    if (src.startsWith("data:")) {
      const placeholder = document.createTextNode("[image]");
      img.parentNode?.replaceChild(placeholder, img);
    }
  }

  // Strip style attributes from all elements
  for (const el of document.querySelectorAll("[style]")) {
    el.removeAttribute("style");
  }

  // Unwrap spans with no remaining attributes
  for (const span of document.querySelectorAll("span")) {
    if (span.attributes.length === 0) {
      span.replaceWith(...span.childNodes);
    }
  }
}

/**
 * Extract the document title with multiple fallback strategies.
 */
function extractTitle(
  document: ReturnType<typeof parseHTML>["document"]
): string {
  const titleEl = document.querySelector("title");
  if (titleEl?.textContent?.trim()) {
    return titleEl.textContent.trim();
  }

  const h1 = document.querySelector("h1");
  if (h1?.textContent?.trim()) {
    return h1.textContent.trim();
  }

  const firstP = document.querySelector("p");
  if (firstP) {
    const bold = firstP.querySelector("b, strong");
    if (bold?.textContent?.trim() && firstP.children.length <= 2) {
      return bold.textContent.trim();
    }
  }

  return "Untitled Google Doc";
}

/**
 * Google Docs-specific HTML-to-markdown conversion with data URI image handling.
 */
function gdocHtmlToMarkdown(html: string): string {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  td.use(gfm);

  // Belt-and-suspenders: catch any remaining data URI images
  td.addRule("dataUriImages", {
    filter: (node) =>
      node.nodeName === "IMG" &&
      (node.getAttribute("src") ?? "").startsWith("data:"),
    replacement: () => "[image]",
  });

  td.remove(["script", "noscript"]);

  return td.turndown(html);
}

export async function convertGdoc(
  url: string,
  _options: ConversionOptions
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

  // Parse and preprocess (strip styles, base64 images, empty spans)
  const { document } = parseHTML(html);
  preprocessGdocHtml(document);
  const title = extractTitle(document);

  // Convert body content directly (skip Readability — Google's export IS the content)
  const body = document.querySelector("body");
  const bodyHtml = body ? body.innerHTML : html;
  let markdown = gdocHtmlToMarkdown(bodyHtml);

  // AI formatting
  markdown = await formatAsMarkdown(markdown, {
    title,
    source: url,
    type: "Google Docs document",
  });

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
