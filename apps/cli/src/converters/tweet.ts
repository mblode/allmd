import { formatAsMarkdown } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { fetchWithTimeout } from "../utils/fetch.js";
import { scrapeMarkdownWithFirecrawl } from "../utils/firecrawl.js";
import { applyFrontmatter } from "../utils/frontmatter.js";
import { trackProgress, verbose } from "../utils/ui.js";

interface OEmbedResponse {
  author_name: string;
  author_url: string;
  html: string;
  provider_name: string;
  url: string;
}

function extractTextFromOEmbed(html: string): string {
  // The oEmbed HTML is a blockquote with the tweet text
  // Strip HTML tags to get plain text
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&mdash;/g, "\u2014")
    .replace(/&nbsp;/g, " ")
    .replace(/pic\.twitter\.com\/\w+/g, "")
    .trim();
}

const TWITTER_URL_RE = /^https?:\/\/(www\.)?(x|twitter)\.com/;

function normalizeUrl(url: string): string {
  // Normalize x.com/twitter.com URLs
  return url.replace(TWITTER_URL_RE, "https://twitter.com");
}

export async function convertTweet(
  url: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  verbose(`Fetching tweet: ${url}`, options.verbose);

  const normalizedUrl = normalizeUrl(url);
  let tweetText = "";
  let author = "";
  let authorUrl = "";

  // Try Twitter oEmbed API first
  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(normalizedUrl)}`;
    options.onProgress?.("Fetching tweet...");
    verbose(`Trying oEmbed API: ${oembedUrl}`, options.verbose);

    const response = await fetchWithTimeout(oembedUrl);
    if (response.ok) {
      const data = (await response.json()) as OEmbedResponse;
      tweetText = extractTextFromOEmbed(data.html);
      author = data.author_name ?? "";
      authorUrl = data.author_url ?? "";
      verbose(
        `oEmbed: got ${tweetText.length} chars from @${author}`,
        options.verbose
      );
    } else {
      throw new Error(`oEmbed API returned ${response.status}`);
    }
  } catch (err) {
    verbose(
      `oEmbed failed: ${err instanceof Error ? err.message : String(err)}`,
      options.verbose
    );
    options.onProgress?.("Fetching with Firecrawl...");
    verbose("Falling back to Firecrawl extraction...", options.verbose);

    try {
      const article = await scrapeMarkdownWithFirecrawl(url, {
        abortSignal: options.abortSignal,
        verbose: options.verbose,
      });
      tweetText = article.content;
    } catch (fallbackErr) {
      throw new Error(
        `Could not extract tweet content from ${url}. ${fallbackErr instanceof Error ? fallbackErr.message : "The tweet may be private or deleted."}`
      );
    }
  }

  if (!tweetText.trim()) {
    throw new Error(
      `Could not extract any text from ${url}. The tweet may be private or deleted.`
    );
  }

  const rawMarkdown = author
    ? `**${author}** (${authorUrl || url}):\n\n${tweetText}`
    : tweetText;

  const markdown = await trackProgress(
    options.onProgress,
    "Formatting with AI...",
    formatAsMarkdown(
      rawMarkdown,
      {
        title: author ? `Tweet by ${author}` : "Tweet",
        source: url,
        type: "tweet",
      },
      options
    )
  );

  const title = author ? `Tweet by ${author}` : "Tweet";

  const withFrontmatter = applyFrontmatter(markdown, options, {
    title,
    source: url,
    type: "tweet",
    author: author || undefined,
  });

  verbose(
    `Final output: ${withFrontmatter.length.toLocaleString()} chars`,
    options.verbose
  );

  return {
    title,
    markdown: withFrontmatter,
    rawContent: tweetText,
    metadata: { author, authorUrl },
  };
}
