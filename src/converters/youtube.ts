import {
  type TranscriptItem,
  YoutubeTranscript,
} from "youtube-transcript-scraper";
import { formatAsMarkdown } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { applyFrontmatter } from "../utils/frontmatter.js";
import { verbose } from "../utils/ui.js";

interface VideoMetadata {
  author: string;
  title: string;
}

async function fetchVideoMetadata(videoId: string): Promise<VideoMetadata> {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch video metadata (HTTP ${response.status})`);
  }

  const data = (await response.json()) as {
    title?: string;
    author_name?: string;
  };

  return {
    title: data.title ?? "Untitled Video",
    author: data.author_name ?? "",
  };
}

const VIDEO_ID_PATTERNS = [
  /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
  /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
];

export function extractVideoId(url: string): string {
  for (const pattern of VIDEO_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  throw new Error(`Could not extract video ID from URL: ${url}`);
}

function formatTranscript(segments: TranscriptItem[]): string {
  return segments.map((s) => s.text).join(" ");
}

export async function convertYoutube(
  url: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  const videoId = extractVideoId(url);
  verbose(`Video ID: ${videoId}`, options.verbose);

  verbose("Fetching metadata and transcript...", options.verbose);
  const [metadata, segments] = await Promise.all([
    fetchVideoMetadata(videoId).catch(
      (): VideoMetadata => ({
        title: "Untitled Video",
        author: "",
      })
    ),
    YoutubeTranscript.fetchTranscript(videoId, {
      lang: ["en", "en-US", "en-GB"],
    }),
  ]);

  if (!segments || segments.length === 0) {
    throw new Error("No captions available for this video");
  }

  verbose(
    `Fetched ${segments.length} caption segments for "${metadata.title}"`,
    options.verbose
  );

  const rawTranscript = formatTranscript(segments);
  verbose(
    `Raw transcript: ${rawTranscript.length.toLocaleString()} chars`,
    options.verbose
  );

  const markdown = await formatAsMarkdown(
    rawTranscript,
    {
      title: metadata.title,
      source: url,
      type: "YouTube video transcript",
    },
    options.verbose
  );

  const withFrontmatter = applyFrontmatter(markdown, options, {
    title: metadata.title,
    source: url,
    type: "youtube",
    videoId,
    author: metadata.author,
  });

  verbose(
    `Final output: ${withFrontmatter.length.toLocaleString()} chars`,
    options.verbose
  );

  return {
    title: metadata.title,
    markdown: withFrontmatter,
    rawContent: rawTranscript,
    metadata: {
      videoId,
      author: metadata.author,
      captionCount: segments.length,
    },
  };
}
