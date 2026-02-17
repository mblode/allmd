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

vi.mock("../ai/client.js", () => ({
  formatAsMarkdown: mocks.formatAsMarkdown,
  transcribeAudio: mocks.transcribeAudio,
  transcribeAudioDiarized: mocks.transcribeAudioDiarized,
}));

vi.mock("ffmpeg-extract-audio", () => ({
  default: mocks.extractAudio,
}));

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
});
