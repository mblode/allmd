import { describe, expect, it, vi } from "vitest";

vi.mock("epub2", () => ({
  default: {
    createAsync: vi.fn().mockResolvedValue({
      metadata: {
        title: "Test Book",
        creator: "Test Author",
        publisher: "Test Publisher",
        language: "en",
      },
      flow: [
        { id: "ch1", title: "Chapter 1" },
        { id: "ch2", title: "Chapter 2" },
      ],
      toc: [],
      spine: { contents: [] },
      getChapterAsync: vi.fn().mockImplementation((id: string) => {
        if (id === "ch1") {
          return Promise.resolve("<p>Chapter one content</p>");
        }
        if (id === "ch2") {
          return Promise.resolve("<p>Chapter two content</p>");
        }
        return Promise.reject(new Error("Not found"));
      }),
    }),
  },
}));

vi.mock("../ai/client.js", () => ({
  formatAsMarkdown: vi
    .fn()
    .mockImplementation((text: string) => Promise.resolve(text)),
}));

import { convertEpub } from "./epub.js";

describe("convertEpub", () => {
  it("converts an epub file to markdown", async () => {
    const result = await convertEpub("/tmp/test.epub", {});

    expect(result.title).toBe("Test Book");
    expect(result.markdown).toContain("Chapter 1");
    expect(result.markdown).toContain("Chapter one content");
    expect(result.markdown).toContain("Chapter two content");
    expect(result.metadata.author).toBe("Test Author");
    expect(result.metadata.chapters).toBe(2);
  });

  it("includes publisher and language in metadata", async () => {
    const result = await convertEpub("/tmp/test.epub", {});

    expect(result.metadata.publisher).toBe("Test Publisher");
    expect(result.metadata.language).toBe("en");
  });

  it("includes frontmatter by default", async () => {
    const result = await convertEpub("/tmp/test.epub", {});
    expect(result.markdown).toContain("---");
    expect(result.markdown).toContain("type: epub");
  });

  it("skips frontmatter when option is false", async () => {
    const result = await convertEpub("/tmp/test.epub", { frontmatter: false });
    expect(result.markdown).not.toContain("type: epub");
  });
});
