import { describe, expect, it, vi } from "vitest";

vi.mock("clipboardy", () => ({
  default: {
    read: vi.fn().mockResolvedValue("  https://example.com  "),
    write: vi.fn().mockResolvedValue(undefined),
  },
}));

import { readClipboard } from "./clipboard.js";

describe("readClipboard", () => {
  it("reads and trims clipboard content", async () => {
    const result = await readClipboard();
    expect(result).toBe("https://example.com");
  });
});
