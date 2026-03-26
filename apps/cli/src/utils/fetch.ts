const DEFAULT_FETCH_TIMEOUT_MS = 30_000;

export async function fetchWithTimeout(
  url: string,
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
  options?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error(
        `Request timed out after ${timeoutMs / 1000}s fetching ${url}. ` +
          "The server may be slow or require JavaScript rendering. " +
          "Set FIRECRAWL_API_KEY in your environment for JS-heavy pages."
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
