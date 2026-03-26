import { describe, expect, it, vi } from "vitest";

vi.mock("../ai/client.js", () => ({
  formatAsMarkdown: vi
    .fn()
    .mockImplementation((text: string) => Promise.resolve(text)),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { convertTweet } from "./tweet.js";

describe("convertTweet", () => {
  it("converts a tweet via oEmbed API", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        html: "<blockquote><p>Hello from Twitter!</p>&mdash; Test User</blockquote>",
        author_name: "TestUser",
        author_url: "https://twitter.com/TestUser",
        provider_name: "Twitter",
        url: "https://twitter.com/TestUser/status/123",
      }),
    });

    const result = await convertTweet(
      "https://twitter.com/TestUser/status/123",
      {}
    );

    expect(result.title).toBe("Tweet by TestUser");
    expect(result.markdown).toContain("Hello from Twitter!");
    expect(result.metadata.author).toBe("TestUser");
  });

  it("normalizes x.com URLs", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        html: "<blockquote><p>From X!</p></blockquote>",
        author_name: "XUser",
        author_url: "https://twitter.com/XUser",
        provider_name: "Twitter",
        url: "https://twitter.com/XUser/status/456",
      }),
    });

    const result = await convertTweet("https://x.com/XUser/status/456", {});

    expect(result.title).toBe("Tweet by XUser");
    expect(result.metadata.author).toBe("XUser");
  });

  it("throws when tweet content is empty", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        html: "<blockquote></blockquote>",
        author_name: "",
        author_url: "",
        provider_name: "Twitter",
        url: "https://twitter.com/test/status/789",
      }),
    });

    await expect(
      convertTweet("https://twitter.com/test/status/789", {})
    ).rejects.toThrow("Could not extract any text");
  });

  it("includes frontmatter in output", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        html: "<blockquote><p>Tweet text</p></blockquote>",
        author_name: "Author",
        author_url: "https://twitter.com/Author",
        provider_name: "Twitter",
        url: "https://twitter.com/Author/status/1",
      }),
    });

    const result = await convertTweet(
      "https://twitter.com/Author/status/1",
      {}
    );
    expect(result.markdown).toContain("---");
    expect(result.markdown).toContain("type: tweet");
  });
});
