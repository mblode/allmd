import { describe, expect, it } from "vitest";

import { isStdinPiped } from "./stdin.js";

describe("isStdinPiped", () => {
  it("returns true when stdin is not a TTY", () => {
    const original = process.stdin.isTTY;
    Object.defineProperty(process.stdin, "isTTY", {
      configurable: true,
      value: undefined,
    });
    expect(isStdinPiped()).toBe(true);
    Object.defineProperty(process.stdin, "isTTY", {
      configurable: true,
      value: original,
    });
  });

  it("returns false when stdin is a TTY", () => {
    const original = process.stdin.isTTY;
    Object.defineProperty(process.stdin, "isTTY", {
      configurable: true,
      value: true,
    });
    expect(isStdinPiped()).toBe(false);
    Object.defineProperty(process.stdin, "isTTY", {
      configurable: true,
      value: original,
    });
  });
});
