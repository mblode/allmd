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
      { outputDir: "/cli/dir", parallel: "5", verbose: true },
      { outputDir: "/config/dir", parallel: 2, verbose: false }
    );

    expect(result.verbose).toBe(true);
    expect(result.outputDir).toBe("/cli/dir");
    expect(result.parallel).toBe("5");
  });

  it("falls back to config when CLI opts are undefined", () => {
    const result = mergeWithCliOpts(
      { outputDir: undefined, parallel: undefined, verbose: undefined },
      { outputDir: "/config/dir", parallel: 4, verbose: true }
    );

    expect(result.verbose).toBe(true);
    expect(result.outputDir).toBe("/config/dir");
    expect(result.parallel).toBe("4");
  });

  it("returns undefined for both undefined", () => {
    const result = mergeWithCliOpts(
      { outputDir: undefined, parallel: undefined, verbose: undefined },
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

  it("falls back to config output and frontmatter", () => {
    const result = mergeWithCliOpts(
      { frontmatter: undefined, output: undefined },
      { frontmatter: false, output: "/tmp/config.md" }
    );

    expect(result.frontmatter).toBe(false);
    expect(result.output).toBe("/tmp/config.md");
  });

  it("prefers the CLI ai flag over config", () => {
    const result = mergeWithCliOpts({ ai: false }, { ai: true });
    expect(result.ai).toBe(false);
  });

  it("falls back to config ai when the CLI flag is undefined", () => {
    const result = mergeWithCliOpts({ ai: undefined }, { ai: false });
    expect(result.ai).toBe(false);
  });
});
