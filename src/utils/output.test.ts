import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("clipboardy", () => ({
  default: {
    read: vi.fn().mockResolvedValue(""),
    write: vi.fn().mockResolvedValue(undefined),
  },
}));

import clipboardy from "clipboardy";
import { generateOutputPath, writeOutput } from "./output.js";

describe("generateOutputPath", () => {
  it("generates a path based on slugified title", () => {
    const path = generateOutputPath("My Test Document");
    expect(path).toContain("my-test-document.md");
  });

  it("uses outputDir when provided", () => {
    const path = generateOutputPath("Test", "/tmp/output");
    expect(path).toContain("/tmp/output/test.md");
  });
});

describe("writeOutput", () => {
  it("writes content to a file when output is specified", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "allmd-output-test-"));
    const filePath = join(tempDir, "test.md");

    await writeOutput("# Hello", { output: filePath });

    const content = await readFile(filePath, "utf-8");
    expect(content).toBe("# Hello");
  });

  it("copies to clipboard when copy option is set", async () => {
    await writeOutput("# Clipboard content", { copy: true });

    expect(clipboardy.write).toHaveBeenCalledWith("# Clipboard content");
  });

  it("writes to stdout when no output file and no copy", async () => {
    const writeSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    await writeOutput("# Stdout", {});

    expect(writeSpy).toHaveBeenCalledWith("# Stdout");
    writeSpy.mockRestore();
  });

  it("does not write to stdout when copy is set", async () => {
    const writeSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    await writeOutput("# Copy only", { copy: true });

    expect(writeSpy).not.toHaveBeenCalled();
    writeSpy.mockRestore();
  });

  it("both copies and writes to file when both options set", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "allmd-output-test-"));
    const filePath = join(tempDir, "both.md");

    await writeOutput("# Both", { output: filePath, copy: true });

    const content = await readFile(filePath, "utf-8");
    expect(content).toBe("# Both");
    expect(clipboardy.write).toHaveBeenCalledWith("# Both");
  });

  it("creates parent directories if they do not exist", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "allmd-output-test-"));
    const filePath = join(tempDir, "nested", "dir", "test.md");

    await writeOutput("# Nested", { output: filePath });

    const content = await readFile(filePath, "utf-8");
    expect(content).toBe("# Nested");
  });
});
