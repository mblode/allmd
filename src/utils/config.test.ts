import { describe, expect, it, vi } from "vitest";

vi.mock("cosmiconfig", () => ({
  cosmiconfig: vi.fn().mockReturnValue({
    search: vi.fn().mockResolvedValue(null),
  }),
}));

import { mergeWithCliOpts } from "./config.js";

describe("mergeWithCliOpts", () => {
  it("uses CLI opts when both are provided", () => {
    const result = mergeWithCliOpts(
      { verbose: true, outputDir: "/cli/dir", parallel: "5" },
      { verbose: false, outputDir: "/config/dir", parallel: 2 }
    );

    expect(result.verbose).toBe(true);
    expect(result.outputDir).toBe("/cli/dir");
    expect(result.parallel).toBe("5");
  });

  it("falls back to config when CLI opts are undefined", () => {
    const result = mergeWithCliOpts(
      { verbose: undefined, outputDir: undefined, parallel: undefined },
      { verbose: true, outputDir: "/config/dir", parallel: 4 }
    );

    expect(result.verbose).toBe(true);
    expect(result.outputDir).toBe("/config/dir");
    expect(result.parallel).toBe("4");
  });

  it("returns undefined for both undefined", () => {
    const result = mergeWithCliOpts(
      { verbose: undefined, outputDir: undefined, parallel: undefined },
      {}
    );

    expect(result.verbose).toBeUndefined();
    expect(result.outputDir).toBeUndefined();
  });

  it("preserves clipboard and copy from CLI opts", () => {
    const result = mergeWithCliOpts({ clipboard: true, copy: true }, {});

    expect(result.clipboard).toBe(true);
    expect(result.copy).toBe(true);
  });

  it("preserves output from CLI opts", () => {
    const result = mergeWithCliOpts({ output: "/tmp/out.md" }, {});

    expect(result.output).toBe("/tmp/out.md");
  });
});
