import { describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    readFile: vi.fn().mockResolvedValue(Buffer.from("fake docx content")),
  };
});

vi.mock("mammoth", () => ({
  default: {
    convertToHtml: vi.fn().mockResolvedValue({
      value: "<h1>Test Doc</h1><p>Hello world</p>",
      messages: [],
    }),
  },
}));

vi.mock("../ai/client.js", () => ({
  formatAsMarkdown: vi.fn().mockResolvedValue("# Test Doc\n\nHello world"),
}));

import { convertDocx } from "./docx.js";

describe("convertDocx", () => {
  it("converts a docx file to markdown", async () => {
    const result = await convertDocx("/tmp/test.docx", {});

    expect(result.title).toBe("test");
    expect(result.markdown).toContain("Test Doc");
    expect(result.markdown).toContain("Hello world");
  });

  it("strips .docx extension from title", async () => {
    const result = await convertDocx("/tmp/my-document.docx", {});
    expect(result.title).toBe("my-document");
  });

  it("strips .doc extension from title", async () => {
    const result = await convertDocx("/tmp/old-file.doc", {});
    expect(result.title).toBe("old-file");
  });

  it("includes frontmatter by default", async () => {
    const result = await convertDocx("/tmp/test.docx", {});
    expect(result.markdown).toContain("---");
    expect(result.markdown).toContain("type: docx");
  });

  it("skips frontmatter when option is false", async () => {
    const result = await convertDocx("/tmp/test.docx", { frontmatter: false });
    expect(result.markdown).not.toContain("type: docx");
  });
});
