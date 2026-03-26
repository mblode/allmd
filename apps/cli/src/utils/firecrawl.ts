import { FirecrawlAppV1 as FirecrawlApp } from "@mendable/firecrawl-js";
import { getRequiredApiKey } from "./keys.js";
import { verbose } from "./ui.js";

const FIRECRAWL_TIMEOUT_MS = 60_000;

export interface FirecrawlMarkdownResult {
  content: string;
  excerpt: string;
  siteName: string;
  title: string;
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
  abortSignal?: AbortSignal
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  let removeAbortListener: (() => void) | undefined;

  try {
    const pending: Promise<T>[] = [
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ];

    if (abortSignal) {
      pending.push(
        new Promise<never>((_, reject) => {
          const rejectWithAbort = (): void => {
            reject(
              abortSignal.reason instanceof Error
                ? abortSignal.reason
                : new Error("Interrupted")
            );
          };

          if (abortSignal.aborted) {
            rejectWithAbort();
            return;
          }

          const onAbort = (): void => {
            rejectWithAbort();
          };

          abortSignal.addEventListener("abort", onAbort, { once: true });
          removeAbortListener = () => {
            abortSignal.removeEventListener("abort", onAbort);
          };
        })
      );
    }

    return await Promise.race(pending);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
    removeAbortListener?.();
  }
}

export async function scrapeMarkdownWithFirecrawl(
  url: string,
  options?: { abortSignal?: AbortSignal; verbose?: boolean }
): Promise<FirecrawlMarkdownResult> {
  verbose("Using Firecrawl (JS rendering enabled)...", options?.verbose);

  const app = new FirecrawlApp({ apiKey: getRequiredApiKey("firecrawl") });
  const result = await withTimeout(
    app.scrapeUrl(url, {
      formats: ["markdown"],
      onlyMainContent: true,
      proxy: "auto",
      timeout: FIRECRAWL_TIMEOUT_MS,
    }),
    FIRECRAWL_TIMEOUT_MS + 5000,
    `Firecrawl timed out after ${FIRECRAWL_TIMEOUT_MS / 1000}s`,
    options?.abortSignal
  );

  if (!result.success) {
    throw new Error(
      `Firecrawl failed: ${"error" in result ? result.error : "unknown error"}`
    );
  }

  const markdown = "markdown" in result ? result.markdown : undefined;
  const metadata = "metadata" in result ? result.metadata : undefined;
  if (!markdown?.trim()) {
    throw new Error(`Firecrawl returned empty markdown for ${url}`);
  }

  verbose(
    `Firecrawl response: ${markdown.length.toLocaleString()} chars markdown`,
    options?.verbose
  );

  return {
    title: metadata?.title ?? "",
    content: markdown,
    excerpt: metadata?.description ?? "",
    siteName: metadata?.sourceURL ?? url,
  };
}
