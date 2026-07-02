import { afterEach, describe, expect, it, vi } from "vitest";
import { info, success, warn } from "./ui.js";

describe("decorative output", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes success, info, and warn to stderr, never stdout", () => {
    const stdout = vi.spyOn(console, "log").mockImplementation(() => {
      // swallow
    });
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {
      // swallow
    });

    success("saved");
    info("detected");
    warn("heads up");

    expect(stdout).not.toHaveBeenCalled();
    expect(stderr).toHaveBeenCalledTimes(3);
    expect(stderr.mock.calls[0][0]).toContain("saved");
    expect(stderr.mock.calls[1][0]).toContain("detected");
    expect(stderr.mock.calls[2][0]).toContain("heads up");
  });
});
