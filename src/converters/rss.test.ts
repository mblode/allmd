import { describe, expect, it, vi } from "vitest";

vi.mock("rss-parser", () => ({
  default: vi.fn().mockImplementation(() => ({
    parseURL: vi.fn().mockResolvedValue({
      title: "Test Blog",
      description: "A test blog feed",
      link: "https://example.com",
      feedUrl: "https://example.com/feed.xml",
      items: [
        {
          title: "First Post",
          link: "https://example.com/post-1",
          creator: "Alice",
          content: "<p>First post content</p>",
          isoDate: "2025-01-15T12:00:00Z",
          categories: ["tech", "news"],
        },
        {
          title: "Second Post",
          link: "https://example.com/post-2",
          contentSnippet: "Second post snippet text",
          pubDate: "Mon, 14 Jan 2025 12:00:00 GMT",
        },
      ],
    }),
  })),
}));

vi.mock("../ai/client.js", () => ({
  formatAsMarkdown: vi
    .fn()
    .mockImplementation((text: string) => Promise.resolve(text)),
}));

import { convertRss } from "./rss.js";

describe("convertRss", () => {
  it("converts an RSS feed to markdown", async () => {
    const result = await convertRss("https://example.com/feed.xml", {});

    expect(result.title).toBe("Test Blog");
    expect(result.markdown).toContain("First Post");
    expect(result.markdown).toContain("Second Post");
    expect(result.metadata.itemCount).toBe(2);
    expect(result.metadata.feedTitle).toBe("Test Blog");
  });

  it("includes feed description", async () => {
    const result = await convertRss("https://example.com/feed.xml", {});
    expect(result.markdown).toContain("A test blog feed");
  });

  it("includes item metadata like author and date", async () => {
    const result = await convertRss("https://example.com/feed.xml", {});
    expect(result.markdown).toContain("Alice");
    expect(result.markdown).toContain("Link");
  });

  it("includes categories as tags", async () => {
    const result = await convertRss("https://example.com/feed.xml", {});
    expect(result.markdown).toContain("tech");
    expect(result.markdown).toContain("news");
  });

  it("falls back to contentSnippet when no content", async () => {
    const result = await convertRss("https://example.com/feed.xml", {});
    expect(result.markdown).toContain("Second post snippet text");
  });

  it("includes frontmatter in output", async () => {
    const result = await convertRss("https://example.com/feed.xml", {});
    expect(result.markdown).toContain("---");
    expect(result.markdown).toContain("type: rss");
  });
});
