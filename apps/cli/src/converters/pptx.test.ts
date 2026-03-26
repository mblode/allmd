import { describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    readFile: vi.fn().mockResolvedValue(Buffer.from("fake pptx content")),
  };
});

// Mock AdmZip to return fake slide XML
const mockEntries = [
  {
    entryName: "ppt/slides/slide1.xml",
    getData: () =>
      Buffer.from("<a:p><a:r><a:t>Slide One Title</a:t></a:r></a:p>", "utf-8"),
  },
  {
    entryName: "ppt/slides/slide2.xml",
    getData: () =>
      Buffer.from(
        "<a:p><a:r><a:t>Slide Two Content</a:t></a:r></a:p>",
        "utf-8"
      ),
  },
  {
    entryName: "ppt/notesSlides/notesSlide1.xml",
    getData: () =>
      Buffer.from(
        "<a:p><a:r><a:t>Speaker notes here</a:t></a:r></a:p>",
        "utf-8"
      ),
  },
];

vi.mock("adm-zip", () => ({
  default: vi.fn().mockImplementation(() => ({
    getEntries: () => mockEntries,
  })),
}));

vi.mock("../ai/client.js", () => ({
  formatAsMarkdown: vi
    .fn()
    .mockImplementation((text: string) => Promise.resolve(text)),
}));

import { convertPptx } from "./pptx.js";

describe("convertPptx", () => {
  it("converts a pptx file to markdown with slides", async () => {
    const result = await convertPptx("/tmp/test.pptx", {});

    expect(result.title).toBe("test");
    expect(result.markdown).toContain("Slide 1");
    expect(result.markdown).toContain("Slide One Title");
    expect(result.markdown).toContain("Slide 2");
    expect(result.markdown).toContain("Slide Two Content");
    expect(result.metadata.slides).toBe(2);
  });

  it("includes speaker notes", async () => {
    const result = await convertPptx("/tmp/test.pptx", {});

    expect(result.markdown).toContain("Speaker notes here");
    expect(result.metadata.hasNotes).toBe(true);
  });

  it("strips .pptx extension from title", async () => {
    const result = await convertPptx("/tmp/presentation.pptx", {});
    expect(result.title).toBe("presentation");
  });

  it("includes frontmatter by default", async () => {
    const result = await convertPptx("/tmp/test.pptx", {});
    expect(result.markdown).toContain("---");
    expect(result.markdown).toContain("type: pptx");
  });

  it("skips frontmatter when option is false", async () => {
    const result = await convertPptx("/tmp/test.pptx", {
      frontmatter: false,
    });
    expect(result.markdown).not.toContain("type: pptx");
  });
});
