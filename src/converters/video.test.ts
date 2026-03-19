import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  extractAudio: vi.fn(),
  formatAsMarkdown: vi.fn(),
  transcribeAudio: vi.fn(),
  transcribeAudioDiarized: vi.fn(),
}));

const audioMocks = vi.hoisted(() => ({
  DIARIZE_CHUNK_SECONDS: 1200,
  DIARIZE_MAX_SECONDS: 1400,
  WHISPER_MAX_BYTES: 26_214_400,
  calculateChunkBoundaries: vi.fn(),
  calculateTargetBitrate: vi.fn().mockReturnValue(64),
  compressAudio: vi.fn().mockResolvedValue(undefined),
  extractAudioChunk: vi.fn(),
  getAudioDuration: vi.fn().mockResolvedValue(300),
  isAudioOversized: vi.fn().mockReturnValue(false),
  needsChunking: vi.fn().mockReturnValue(false),
}));

vi.mock("../ai/client.js", () => ({
  formatAsMarkdown: mocks.formatAsMarkdown,
  transcribeAudio: mocks.transcribeAudio,
  transcribeAudioDiarized: mocks.transcribeAudioDiarized,
}));

vi.mock("ffmpeg-extract-audio", () => ({
  default: mocks.extractAudio,
}));

vi.mock("../utils/audio.js", () => audioMocks);

import { convertVideo } from "./video.js";

describe("convertVideo", () => {
  beforeEach(() => {
    mocks.formatAsMarkdown.mockImplementation((text: string) =>
      Promise.resolve(text)
    );
    mocks.extractAudio.mockImplementation(async ({ output }) => {
      await writeFile(output as string, "transcoded-audio");
    });
    mocks.transcribeAudio.mockResolvedValue({ text: "plain transcript" });
    mocks.transcribeAudioDiarized.mockResolvedValue({
      segments: [{ end: 1, speaker: "speaker_0", start: 0, text: "Hello" }],
      speakers: ["speaker_0"],
      text: "Hello",
    });

    // Reset audio mocks to defaults
    audioMocks.isAudioOversized.mockReturnValue(false);
    audioMocks.needsChunking.mockReturnValue(false);
    audioMocks.getAudioDuration.mockResolvedValue(300);
    audioMocks.calculateTargetBitrate.mockReturnValue(64);
    audioMocks.compressAudio.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  async function writeTempFile(
    extension: string,
    content = "audio"
  ): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), "allmd-video-test-"));
    const filePath = join(dir, `input${extension}`);
    await writeFile(filePath, content);
    return filePath;
  }

  it("forces diarization when speakers are provided", async () => {
    const filePath = await writeTempFile(".mp3");
    await convertVideo(filePath, { diarize: false, speakers: ["Alice"] });

    expect(mocks.transcribeAudioDiarized).toHaveBeenCalledTimes(1);
    expect(mocks.transcribeAudio).not.toHaveBeenCalled();
  });

  it("transcodes unsupported audio formats to mp3 before diarization", async () => {
    const filePath = await writeTempFile(".ogg");
    await convertVideo(filePath, { diarize: true });

    expect(mocks.extractAudio).toHaveBeenCalledTimes(1);
    expect(mocks.extractAudio).toHaveBeenCalledWith(
      expect.objectContaining({
        format: "mp3",
        input: filePath,
      })
    );
    expect(mocks.transcribeAudioDiarized).toHaveBeenCalledWith(
      expect.any(Buffer),
      [],
      undefined,
      "audio.mp3",
      []
    );
  });

  it("passes speaker references through to diarized transcription", async () => {
    const filePath = await writeTempFile(".mp3");
    await convertVideo(filePath, {
      speakerReferences: ["./alice.wav"],
      speakers: ["Alice"],
    });

    expect(mocks.transcribeAudioDiarized).toHaveBeenCalledWith(
      expect.any(Buffer),
      ["Alice"],
      undefined,
      "input.mp3",
      ["./alice.wav"]
    );
  });

  it("rejects speaker references without matching speaker names", async () => {
    const filePath = await writeTempFile(".mp3");

    await expect(
      convertVideo(filePath, { speakerReferences: ["./alice.wav"] })
    ).rejects.toThrow("require --speakers");
    expect(mocks.transcribeAudioDiarized).not.toHaveBeenCalled();
  });

  it("does not compress when audio is under the size limit", async () => {
    audioMocks.isAudioOversized.mockReturnValue(false);

    const filePath = await writeTempFile(".mp3");
    await convertVideo(filePath, { diarize: false });

    expect(audioMocks.compressAudio).not.toHaveBeenCalled();
    expect(mocks.transcribeAudio).toHaveBeenCalledTimes(1);
  });

  it("compresses audio when buffer exceeds size limit", async () => {
    audioMocks.isAudioOversized.mockReturnValue(true);
    audioMocks.needsChunking.mockReturnValue(false);
    audioMocks.compressAudio.mockImplementation(
      async (_input: string, output: string) => {
        await writeFile(output, "compressed");
      }
    );

    const filePath = await writeTempFile(".mp3");
    await convertVideo(filePath, { diarize: false });

    expect(audioMocks.getAudioDuration).toHaveBeenCalledTimes(1);
    expect(audioMocks.calculateTargetBitrate).toHaveBeenCalledTimes(1);
    expect(audioMocks.compressAudio).toHaveBeenCalledTimes(1);
    expect(mocks.transcribeAudio).toHaveBeenCalledTimes(1);
  });

  it("splits and transcribes chunks for very long audio", async () => {
    audioMocks.isAudioOversized.mockReturnValue(true);
    audioMocks.needsChunking.mockReturnValue(true);
    audioMocks.getAudioDuration.mockResolvedValue(7200);
    audioMocks.calculateChunkBoundaries.mockReturnValue([
      { startSeconds: 0, durationSeconds: 1500, index: 0 },
      { startSeconds: 1485, durationSeconds: 1500, index: 1 },
    ]);
    audioMocks.extractAudioChunk.mockImplementation(
      async (_input: string, output: string) => {
        await writeFile(output, "chunk-audio");
      }
    );

    const filePath = await writeTempFile(".mp3");
    await convertVideo(filePath, { diarize: false });

    expect(audioMocks.extractAudioChunk).toHaveBeenCalledTimes(2);
    expect(mocks.transcribeAudio).toHaveBeenCalledTimes(2);
  });

  it("splits and transcribes diarized chunks for very long audio", async () => {
    audioMocks.isAudioOversized.mockReturnValue(true);
    audioMocks.needsChunking.mockReturnValue(true);
    audioMocks.getAudioDuration.mockResolvedValue(7200);
    audioMocks.calculateChunkBoundaries.mockReturnValue([
      { startSeconds: 0, durationSeconds: 1500, index: 0 },
      { startSeconds: 1485, durationSeconds: 1500, index: 1 },
    ]);
    audioMocks.extractAudioChunk.mockImplementation(
      async (_input: string, output: string) => {
        await writeFile(output, "chunk-audio");
      }
    );

    const filePath = await writeTempFile(".mp3");
    await convertVideo(filePath, { diarize: true });

    expect(audioMocks.extractAudioChunk).toHaveBeenCalledTimes(2);
    expect(mocks.transcribeAudioDiarized).toHaveBeenCalledTimes(2);
  });

  it("chunks diarized audio over 1400s even when file size is under limit", async () => {
    audioMocks.isAudioOversized.mockReturnValue(false);
    audioMocks.getAudioDuration.mockResolvedValue(3600);
    audioMocks.needsChunking.mockReturnValue(true);
    audioMocks.calculateChunkBoundaries.mockReturnValue([
      { startSeconds: 0, durationSeconds: 1200, index: 0 },
      { startSeconds: 1185, durationSeconds: 1200, index: 1 },
      { startSeconds: 2370, durationSeconds: 1200, index: 2 },
    ]);
    audioMocks.extractAudioChunk.mockImplementation(
      async (_input: string, output: string) => {
        await writeFile(output, "chunk-audio");
      }
    );

    const filePath = await writeTempFile(".mp3");
    await convertVideo(filePath, { diarize: true });

    expect(audioMocks.needsChunking).toHaveBeenCalledWith(3600, true);
    expect(audioMocks.extractAudioChunk).toHaveBeenCalledTimes(3);
    expect(mocks.transcribeAudioDiarized).toHaveBeenCalledTimes(3);
  });

  it("does not chunk short diarized audio under 1400s", async () => {
    audioMocks.isAudioOversized.mockReturnValue(false);
    audioMocks.getAudioDuration.mockResolvedValue(600);
    audioMocks.needsChunking.mockReturnValue(false);

    const filePath = await writeTempFile(".mp3");
    await convertVideo(filePath, { diarize: true });

    expect(audioMocks.needsChunking).toHaveBeenCalledWith(600, true);
    expect(audioMocks.extractAudioChunk).not.toHaveBeenCalled();
    expect(mocks.transcribeAudioDiarized).toHaveBeenCalledTimes(1);
  });
});
