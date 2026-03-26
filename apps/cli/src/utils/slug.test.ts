import { describe, expect, it } from "vitest";
import { slugify } from "./slug.js";

const TRAILING_HYPHEN = /-$/;

describe("slugify", () => {
  it("converts text to lowercase kebab-case", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips non-alphanumeric characters", () => {
    expect(slugify("Hello, World! #1")).toBe("hello-world-1");
  });

  it("collapses consecutive hyphens", () => {
    expect(slugify("a---b")).toBe("a-b");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
  });

  it("returns 'untitled' for empty or whitespace input", () => {
    expect(slugify("")).toBe("untitled");
    expect(slugify("   ")).toBe("untitled");
    expect(slugify("!!!")).toBe("untitled");
  });

  it("truncates to maxLength at word boundary", () => {
    const result = slugify(
      "this is a very long title that should be truncated",
      20
    );
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result).not.toMatch(TRAILING_HYPHEN);
  });

  it("uses default maxLength of 80", () => {
    const long = "a".repeat(100);
    expect(slugify(long).length).toBeLessThanOrEqual(80);
  });
});
