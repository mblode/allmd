import { describe, expect, it, vi } from "vitest";
import { isGlobPattern, processBatch } from "./batch.js";

vi.mock("clipboardy", () => ({
  default: {
    read: vi.fn().mockResolvedValue(""),
    write: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("isGlobPattern", () => {
  it("returns true for patterns with *", () => {
    expect(isGlobPattern("*.pdf")).toBe(true);
    expect(isGlobPattern("docs/*.pdf")).toBe(true);
  });

  it("returns true for patterns with ?", () => {
    expect(isGlobPattern("file?.pdf")).toBe(true);
  });

  it("returns true for patterns with {}", () => {
    expect(isGlobPattern("*.{pdf,docx}")).toBe(true);
  });

  it("returns true for patterns with []", () => {
    expect(isGlobPattern("file[0-9].pdf")).toBe(true);
  });

  it("returns false for regular file paths", () => {
    expect(isGlobPattern("/path/to/file.pdf")).toBe(false);
    expect(isGlobPattern("file.pdf")).toBe(false);
    expect(isGlobPattern("my document.pdf")).toBe(false);
  });
});

describe("processBatch", () => {
  it("processes files with a converter function", async () => {
    const converter = vi.fn().mockResolvedValue({
      title: "Test",
      markdown: "# Test",
      rawContent: "test",
      metadata: {},
    });

    const result = await processBatch(
      ["/tmp/a.pdf", "/tmp/b.pdf"],
      converter,
      {},
      { parallel: 2 }
    );

    expect(converter).toHaveBeenCalledTimes(2);
    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.total).toBe(2);
  });

  it("counts failures correctly", async () => {
    const converter = vi
      .fn()
      .mockResolvedValueOnce({
        title: "OK",
        markdown: "# OK",
        rawContent: "ok",
        metadata: {},
      })
      .mockRejectedValueOnce(new Error("conversion failed"));

    const result = await processBatch(
      ["/tmp/a.pdf", "/tmp/b.pdf"],
      converter,
      {},
      { parallel: 1 }
    );

    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.total).toBe(2);
  });

  it("calls progress callback", async () => {
    const converter = vi.fn().mockResolvedValue({
      title: "Test",
      markdown: "# Test",
      rawContent: "test",
      metadata: {},
    });
    const onProgress = vi.fn();

    await processBatch(
      ["/tmp/a.pdf", "/tmp/b.pdf", "/tmp/c.pdf"],
      converter,
      {},
      { parallel: 1 },
      onProgress
    );

    expect(onProgress).toHaveBeenCalled();
    // Final call should have total matching files count
    const lastCall = onProgress.mock.calls.at(-1);
    expect(lastCall[1]).toBe(3);
  });

  it("respects parallel limit", async () => {
    let maxConcurrent = 0;
    let currentConcurrent = 0;

    const converter = vi.fn().mockImplementation(async () => {
      currentConcurrent++;
      maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
      await new Promise((r) => setTimeout(r, 10));
      currentConcurrent--;
      return {
        title: "Test",
        markdown: "# Test",
        rawContent: "test",
        metadata: {},
      };
    });

    await processBatch(
      ["/tmp/a.pdf", "/tmp/b.pdf", "/tmp/c.pdf", "/tmp/d.pdf"],
      converter,
      {},
      { parallel: 2 }
    );

    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });
});
