import { formatAsMarkdown } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { addFrontmatter } from "../utils/frontmatter.js";
import { verbose } from "../utils/ui.js";

const GDOC_ID_RE = /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/;
const FIRST_HEADING_RE = /^#\s+(.+)$/m;

export function extractDocId(url: string): string {
  const match = url.match(GDOC_ID_RE);
  if (!match) {
    throw new Error(`Could not extract document ID from URL: ${url}`);
  }
  return match[1];
}

/**
 * Extract the document title from the first markdown heading.
 */
function extractTitle(markdown: string): string {
  const match = markdown.match(FIRST_HEADING_RE);
  if (match?.[1]?.trim()) {
    return match[1].trim();
  }
  return "Untitled Google Doc";
}

export async function convertGdoc(
  url: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  const docId = extractDocId(url);
  verbose(`Document ID: ${docId}`, options.verbose);

  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=markdown`;
  verbose("Fetching markdown export...", options.verbose);

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

  const rawMarkdown = await response.text();
  const title = extractTitle(rawMarkdown);
  verbose(
    `Exported "${title}" (${rawMarkdown.length.toLocaleString()} chars)`,
    options.verbose
  );

  const markdown = await formatAsMarkdown(
    rawMarkdown,
    {
      title,
      source: url,
      type: "Google Docs document",
    },
    options.verbose
  );

  const withFrontmatter = addFrontmatter(markdown, {
    title,
    source: url,
    date: new Date().toISOString(),
    type: "gdoc",
    docId,
  });

  verbose(
    `Final output: ${withFrontmatter.length.toLocaleString()} chars`,
    options.verbose
  );

  return {
    title,
    markdown: withFrontmatter,
    rawContent: rawMarkdown,
    metadata: { docId },
  };
}
