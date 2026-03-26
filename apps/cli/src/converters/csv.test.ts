import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../ai/client.js", () => ({
  formatAsMarkdown: vi
    .fn()
    .mockImplementation((text: string) => Promise.resolve(text)),
}));

import { convertCsv } from "./csv.js";

describe("convertCsv", () => {
  let tempDir: string;

  afterEach(async () => {
    // cleanup not strictly needed for tmpdir files, but good practice
  });

  async function writeTempFile(name: string, content: string): Promise<string> {
    tempDir = await mkdtemp(join(tmpdir(), "allmd-csv-test-"));
    const filePath = join(tempDir, name);
    await writeFile(filePath, content, "utf-8");
    return filePath;
  }

  it("converts a CSV file to markdown table", async () => {
    const filePath = await writeTempFile(
      "data.csv",
      "Name,Age,City\nAlice,30,NYC\nBob,25,LA\n"
    );
    const result = await convertCsv(filePath, {});

    expect(result.title).toBe("data");
    expect(result.markdown).toContain("Name");
    expect(result.markdown).toContain("Alice");
    expect(result.markdown).toContain("Bob");
    expect(result.metadata.rows).toBe(2);
    expect(result.metadata.delimiter).toBe(",");
  });

  it("detects tab-delimited files", async () => {
    const filePath = await writeTempFile(
      "data.tsv",
      "Name\tAge\nAlice\t30\nBob\t25\n"
    );
    const result = await convertCsv(filePath, {});

    expect(result.title).toBe("data");
    expect(result.metadata.delimiter).toBe("\t");
    expect(result.metadata.rows).toBe(2);
  });

  it("handles quoted fields with commas", async () => {
    const filePath = await writeTempFile(
      "quoted.csv",
      'Name,Address\nAlice,"123 Main St, Apt 4"\n'
    );
    const result = await convertCsv(filePath, {});

    expect(result.markdown).toContain("123 Main St, Apt 4");
  });

  it("includes frontmatter by default", async () => {
    const filePath = await writeTempFile("data.csv", "A,B\n1,2\n");
    const result = await convertCsv(filePath, {});

    expect(result.markdown).toContain("---");
    expect(result.markdown).toContain("type: csv");
  });

  it("skips frontmatter when option is false", async () => {
    const filePath = await writeTempFile("data.csv", "A,B\n1,2\n");
    const result = await convertCsv(filePath, { frontmatter: false });

    expect(result.markdown).not.toContain("type: csv");
  });
});
