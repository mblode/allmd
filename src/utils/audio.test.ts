import { describe, expect, it } from "vitest";
import {
  calculateChunkBoundaries,
  calculateTargetBitrate,
  isAudioOversized,
  needsChunking,
} from "./audio.js";

describe("isAudioOversized", () => {
  it("returns false for small buffers", () => {
    expect(isAudioOversized(Buffer.alloc(1_000_000))).toBe(false);
  });

  it("returns false at the safe boundary", () => {
    expect(isAudioOversized(Buffer.alloc(24_000_000))).toBe(false);
  });

  it("returns true for buffers over the safe limit", () => {
    expect(isAudioOversized(Buffer.alloc(24_000_001))).toBe(true);
  });
});

describe("calculateTargetBitrate", () => {
  it("returns reasonable bitrate for 30-minute audio", () => {
    const bitrate = calculateTargetBitrate(1800);
    // 24MB * 8 / 1800s / 1000 ≈ 106 kbps
    expect(bitrate).toBeGreaterThanOrEqual(32);
    expect(bitrate).toBeLessThanOrEqual(128);
  });

  it("never goes below 32kbps", () => {
    const bitrate = calculateTargetBitrate(100_000);
    expect(bitrate).toBe(32);
  });

  it("returns higher bitrate for short audio", () => {
    const bitrate = calculateTargetBitrate(60);
    // 24MB * 8 / 60s / 1000 = 3200 kbps
    expect(bitrate).toBeGreaterThan(1000);
  });
});

describe("needsChunking", () => {
  it("returns false for short audio", () => {
    expect(needsChunking(3600)).toBe(false); // 1 hour
  });

  it("returns false at the boundary", () => {
    expect(needsChunking(6000)).toBe(false);
  });

  it("returns true for very long audio", () => {
    expect(needsChunking(6001)).toBe(true);
  });
});

describe("calculateChunkBoundaries", () => {
  it("returns a single chunk for short audio", () => {
    const chunks = calculateChunkBoundaries(600);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].startSeconds).toBe(0);
    expect(chunks[0].durationSeconds).toBe(600);
    expect(chunks[0].index).toBe(0);
  });

  it("creates overlapping chunks for long audio", () => {
    const chunks = calculateChunkBoundaries(3600); // 1 hour
    expect(chunks.length).toBeGreaterThan(1);

    // Verify overlap: chunk N+1 starts before chunk N ends
    for (let i = 1; i < chunks.length; i++) {
      const prevEnd =
        chunks[i - 1].startSeconds + chunks[i - 1].durationSeconds;
      expect(chunks[i].startSeconds).toBeLessThan(prevEnd);
    }
  });

  it("covers the entire duration", () => {
    const total = 7200; // 2 hours
    const chunks = calculateChunkBoundaries(total);
    // biome-ignore lint/style/noNonNullAssertion: chunks is guaranteed non-empty
    const lastChunk = chunks.at(-1)!;
    expect(
      lastChunk.startSeconds + lastChunk.durationSeconds
    ).toBeGreaterThanOrEqual(total);
  });

  it("uses sequential indices", () => {
    const chunks = calculateChunkBoundaries(5000);
    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].index).toBe(i);
    }
  });
});
