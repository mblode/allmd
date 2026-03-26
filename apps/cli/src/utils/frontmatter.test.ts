import { describe, expect, it } from "vitest";
import { addFrontmatter, parseFrontmatter } from "./frontmatter.js";

describe("addFrontmatter", () => {
  it("adds YAML frontmatter to content", () => {
    const result = addFrontmatter("# Hello", {
      title: "Test",
      source: "https://example.com",
      date: "2025-01-01",
      type: "web",
    });
    expect(result).toContain("---");
    expect(result).toContain("title: Test");
    expect(result).toContain("# Hello");
  });
});

describe("parseFrontmatter", () => {
  it("parses YAML frontmatter from markdown", () => {
    const input = `---
title: Test
type: web
---
# Hello`;
    const result = parseFrontmatter(input);
    expect(result.data.title).toBe("Test");
    expect(result.data.type).toBe("web");
    expect(result.content).toContain("# Hello");
  });

  it("returns empty data for content without frontmatter", () => {
    const result = parseFrontmatter("# No frontmatter");
    expect(result.data).toEqual({});
    expect(result.content).toContain("# No frontmatter");
  });
});
