import { describe, expect, it } from "vitest";
import { htmlToMarkdown } from "./web.js";

describe("htmlToMarkdown", () => {
  it("converts basic HTML to markdown", () => {
    expect(htmlToMarkdown("<h1>Hello</h1>")).toContain("# Hello");
  });

  it("converts paragraphs", () => {
    const result = htmlToMarkdown("<p>First</p><p>Second</p>");
    expect(result).toContain("First");
    expect(result).toContain("Second");
  });

  it("converts links", () => {
    const result = htmlToMarkdown('<a href="https://example.com">Link</a>');
    expect(result).toContain("[Link](https://example.com)");
  });

  it("converts unordered lists", () => {
    const result = htmlToMarkdown("<ul><li>One</li><li>Two</li></ul>");
    expect(result).toContain("-   One");
    expect(result).toContain("-   Two");
  });

  it("converts code blocks", () => {
    const result = htmlToMarkdown("<pre><code>const x = 1;</code></pre>");
    expect(result).toContain("const x = 1;");
  });
});
