import {
  YoutubeTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError,
} from "youtube-transcript";
import type { TranscriptResponse } from "youtube-transcript";

import { formatAsMarkdown } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { fetchWithTimeout } from "../utils/fetch.js";
import { applyFrontmatter } from "../utils/frontmatter.js";
import { trackProgress, verbose } from "../utils/ui.js";

interface VideoMetadata {
  author: string;
  title: string;
}

const YOUTUBE_FETCH_TIMEOUT_MS = 30_000;

function mergeSignals(
  first?: AbortSignal | null,
  second?: AbortSignal | null
): AbortSignal | undefined {
  if (first && second) {
    return AbortSignal.any([first, second]);
  }
  return first ?? second ?? undefined;
}

async function fetchVideoMetadata(
  videoId: string,
  abortSignal?: AbortSignal
): Promise<VideoMetadata> {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  const response = await fetchWithTimeout(url, YOUTUBE_FETCH_TIMEOUT_MS, {
    signal: abortSignal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch video metadata (HTTP ${response.status})`);
  }

  const data = (await response.json()) as {
    title?: string;
    author_name?: string;
  };

  return {
    author: data.author_name ?? "",
    title: data.title ?? "Untitled Video",
  };
}

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const YOUTUBE_HOST_PREFIX_RE = /^(www\.|m\.)/;

export function extractVideoId(url: string): string {
  if (VIDEO_ID_RE.test(url)) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(YOUTUBE_HOST_PREFIX_RE, "");

    if (hostname === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      if (id && VIDEO_ID_RE.test(id)) {
        return id;
      }
    }

    if (hostname === "youtube.com" || hostname === "youtube-nocookie.com") {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        if (id && VIDEO_ID_RE.test(id)) {
          return id;
        }
      }

      const [kind, id] = parsed.pathname.split("/").filter(Boolean);
      if (
        (kind === "embed" || kind === "shorts" || kind === "live") &&
        id &&
        VIDEO_ID_RE.test(id)
      ) {
        return id;
      }
    }
  } catch {
    // Fall through to a consistent user-facing error.
  }

  throw new Error(`Could not extract video ID from URL: ${url}`);
}

function formatTranscript(segments: TranscriptResponse[]): string {
  return segments.map((s) => s.text).join(" ");
}

async function fetchTranscript(
  videoId: string,
  abortSignal?: AbortSignal
): Promise<TranscriptResponse[]> {
  const fetchWithAbort: typeof fetch = (input, init) =>
    fetchWithTimeout(String(input), YOUTUBE_FETCH_TIMEOUT_MS, {
      ...init,
      signal: mergeSignals(init?.signal, abortSignal),
    });

  try {
    return await YoutubeTranscript.fetchTranscript(videoId, {
      fetch: fetchWithAbort,
      lang: "en",
    });
  } catch (error) {
    if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
      return YoutubeTranscript.fetchTranscript(videoId, {
        fetch: fetchWithAbort,
      });
    }
    if (error instanceof YoutubeTranscriptDisabledError) {
      throw new TypeError("Captions are disabled for this video", {
        cause: error,
      });
    }
    if (error instanceof YoutubeTranscriptNotAvailableError) {
      throw new TypeError("No captions available for this video", {
        cause: error,
      });
    }
    if (error instanceof YoutubeTranscriptVideoUnavailableError) {
      throw new TypeError("Video is unavailable or private", { cause: error });
    }
    if (error instanceof YoutubeTranscriptTooManyRequestError) {
      throw new TypeError(
        "YouTube rate limit hit — try again in a few minutes or from a different IP",
        { cause: error }
      );
    }
    throw error;
  }
}

export async function convertYoutube(
  url: string,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  const videoId = extractVideoId(url);
  verbose(`Video ID: ${videoId}`, options.verbose);

  options.onProgress?.("Fetching transcript...");
  verbose("Fetching metadata and transcript...", options.verbose);
  const [metadata, segments] = await Promise.all([
    fetchVideoMetadata(videoId, options.abortSignal).catch(
      (): VideoMetadata => ({
        author: "",
        title: "Untitled Video",
      })
    ),
    fetchTranscript(videoId, options.abortSignal),
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

  const markdown =
    options.ai === false
      ? rawTranscript
      : await trackProgress(
          options.onProgress,
          "Formatting with AI...",
          formatAsMarkdown(
            rawTranscript,
            {
              source: url,
              title: metadata.title,
              type: "YouTube video transcript",
            },
            options
          )
        );

  const withFrontmatter = applyFrontmatter(markdown, options, {
    author: metadata.author,
    source: url,
    title: metadata.title,
    type: "youtube",
    videoId,
  });

  verbose(
    `Final output: ${withFrontmatter.length.toLocaleString()} chars`,
    options.verbose
  );

  return {
    markdown: withFrontmatter,
    metadata: {
      author: metadata.author,
      captionCount: segments.length,
      videoId,
    },
    rawContent: rawTranscript,
    title: metadata.title,
  };
}
