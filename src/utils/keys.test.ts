import { afterEach, describe, expect, it } from "vitest";
import { assertRequiredApiKeys } from "./keys.js";

const originalOpenAI = process.env.OPENAI_API_KEY;
const originalFirecrawl = process.env.FIRECRAWL_API_KEY;

afterEach(() => {
  process.env.OPENAI_API_KEY = originalOpenAI ?? "";
  process.env.FIRECRAWL_API_KEY = originalFirecrawl ?? "";
});

describe("assertRequiredApiKeys", () => {
  it("does not require keys that are not requested", () => {
    process.env.OPENAI_API_KEY = "";
    process.env.FIRECRAWL_API_KEY = "";

    expect(() => assertRequiredApiKeys({})).not.toThrow();
  });

  it("requires OPENAI_API_KEY when requested", () => {
    process.env.OPENAI_API_KEY = "";

    expect(() => assertRequiredApiKeys({ openai: true })).toThrow(
      "OPENAI_API_KEY"
    );
  });

  it("requires FIRECRAWL_API_KEY when requested", () => {
    process.env.FIRECRAWL_API_KEY = "";

    expect(() => assertRequiredApiKeys({ firecrawl: true })).toThrow(
      "FIRECRAWL_API_KEY"
    );
  });

  it("passes when the requested keys are present", () => {
    process.env.OPENAI_API_KEY = "openai";
    process.env.FIRECRAWL_API_KEY = "firecrawl";

    expect(() =>
      assertRequiredApiKeys({ openai: true, firecrawl: true })
    ).not.toThrow();
  });
});
