import { beforeEach, describe, expect, it, vi } from "vitest";

const { scrapeUrl } = vi.hoisted(() => ({
  scrapeUrl: vi.fn(),
}));

vi.mock("@mendable/firecrawl-js", () => ({
  FirecrawlAppV1: class FirecrawlAppV1 {
    scrapeUrl = scrapeUrl;
  },
}));

import { convertWeb } from "./web.js";

describe("convertWeb", () => {
  beforeEach(() => {
    scrapeUrl.mockReset();
    process.env.FIRECRAWL_API_KEY = "";
  });

  it("requires FIRECRAWL_API_KEY", async () => {
    await expect(
      convertWeb("https://example.com/article", { frontmatter: false })
    ).rejects.toThrow("FIRECRAWL_API_KEY");
  });

  it("uses Firecrawl markdown as the raw web content", async () => {
    const onProgress = vi.fn();

    process.env.FIRECRAWL_API_KEY = "test-key";
    scrapeUrl.mockResolvedValue({
      success: true,
      markdown: "# Raw markdown",
      metadata: {
        description: "Example description",
        sourceURL: "https://example.com/article",
        title: "Example Article",
      },
    });

    const result = await convertWeb("https://example.com/article", {
      frontmatter: false,
      onProgress,
    });

    expect(scrapeUrl).toHaveBeenCalledWith(
      "https://example.com/article",
      expect.objectContaining({
        formats: ["markdown"],
        onlyMainContent: true,
        proxy: "auto",
        timeout: 60_000,
      })
    );
    expect(onProgress).toHaveBeenNthCalledWith(
      1,
      "Rendering with Firecrawl..."
    );
    expect(onProgress).toHaveBeenNthCalledWith(2, "Applying frontmatter...");
    expect(result).toEqual({
      title: "Example Article",
      markdown: "# Raw markdown",
      rawContent: "# Raw markdown",
      metadata: {
        excerpt: "Example description",
        provider: "firecrawl",
        siteName: "https://example.com/article",
      },
    });
  });
});
