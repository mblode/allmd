import { describe, expect, it } from "vitest";
import { extractVideoId } from "./youtube.js";

describe("extractVideoId", () => {
  it("extracts ID from standard watch URL", () => {
    expect(extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("extracts ID from short URL", () => {
    expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("extracts ID from embed URL", () => {
    expect(
      extractVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from shorts URL", () => {
    expect(
      extractVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from URL with extra params", () => {
    expect(
      extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s")
    ).toBe("dQw4w9WgXcQ");
  });

  it("throws for invalid URL", () => {
    expect(() => extractVideoId("https://example.com")).toThrow(
      "Could not extract video ID"
    );
  });
});
