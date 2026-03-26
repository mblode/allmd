import { describe, expect, it } from "vitest";
import { cleanFilePath } from "./path.js";

describe("cleanFilePath", () => {
  it("strips surrounding double quotes", () => {
    expect(cleanFilePath('"./file.txt"')).toBe("./file.txt");
  });

  it("strips surrounding single quotes", () => {
    expect(cleanFilePath("'./file.txt'")).toBe("./file.txt");
  });

  it("trims whitespace", () => {
    expect(cleanFilePath("  ./file.txt  ")).toBe("./file.txt");
  });

  it("resolves \\u{xxxx} Unicode escapes", () => {
    expect(cleanFilePath("file\\u{202f}name.txt")).toBe("file\u202fname.txt");
  });

  it("resolves \\uXXXX Unicode escapes", () => {
    expect(cleanFilePath("file\\u202Fname.txt")).toBe("file\u202fname.txt");
  });

  it("resolves shell backslash escapes", () => {
    expect(cleanFilePath("path\\ to\\ file.txt")).toBe("path to file.txt");
  });

  it("normalises to NFC", () => {
    // é as e + combining acute (NFD) should become single codepoint (NFC)
    const nfd = "e\u0301";
    expect(cleanFilePath(nfd)).toBe("\u00e9");
  });
});
