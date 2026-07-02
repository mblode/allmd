import { describe, expect, it, vi } from "vitest";

const describeImage = vi.fn().mockResolvedValue("Extracted text");

vi.mock("../ai/client.js", () => ({
  describeImage: (...args: unknown[]) => describeImage(...args),
}));

import { convertImage } from "./image.js";

describe("convertImage", () => {
  it("fails fast when --no-ai is used", async () => {
    await expect(
      convertImage("/tmp/screenshot.png", { ai: false })
    ).rejects.toThrow("requires AI vision");
    expect(describeImage).not.toHaveBeenCalled();
  });
});
