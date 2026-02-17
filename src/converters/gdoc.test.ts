import { describe, expect, it } from "vitest";
import { extractDocId } from "./gdoc.js";

describe("extractDocId", () => {
  it("extracts ID from standard Google Docs URL", () => {
    expect(
      extractDocId(
        "https://docs.google.com/document/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/edit"
      )
    ).toBe("1aBcDeFgHiJkLmNoPqRsTuVwXyZ");
  });

  it("extracts ID from URL without /edit", () => {
    expect(
      extractDocId(
        "https://docs.google.com/document/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
      )
    ).toBe("1aBcDeFgHiJkLmNoPqRsTuVwXyZ");
  });

  it("throws for invalid URL", () => {
    expect(() => extractDocId("https://example.com")).toThrow(
      "Could not extract document ID"
    );
  });
});
