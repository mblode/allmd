import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: () => {
    const openai = () => ({});
    openai.transcription = () => ({});
    return openai;
  },
}));

vi.mock("ai", () => ({
  experimental_transcribe: vi.fn(),
  generateText: vi.fn(),
}));

const createTranscription = vi.fn();

vi.mock("openai", () => ({
  default: class OpenAI {
    audio = { transcriptions: { create: createTranscription } };
  },
}));

import { transcribeAudioDiarized } from "./client.js";

describe("transcribeAudioDiarized", () => {
  beforeEach(() => {
    createTranscription.mockReset();
  });

  it("preserves audio filename and mime type for diarized uploads", async () => {
    createTranscription.mockResolvedValue({
      segments: [],
      text: "transcript",
    });

    await transcribeAudioDiarized(
      Buffer.from("audio"),
      undefined,
      false,
      "recording.wav"
    );

    const request = createTranscription.mock.calls[0]?.[0] as { file: File };
    expect(request.file.name).toBe("recording.wav");
    expect(request.file.type).toBe("audio/wav");
  });

  it("does not send known speaker params without reference audio", async () => {
    createTranscription.mockResolvedValue({
      segments: [
        {
          end: 1,
          id: "1",
          speaker: "speaker_0",
          start: 0,
          text: "Hello",
        },
        {
          end: 2,
          id: "2",
          speaker: "speaker_1",
          start: 1,
          text: "World",
        },
      ],
      text: "Hello World",
    });

    const result = await transcribeAudioDiarized(
      Buffer.from("audio"),
      ["Alice", "Bob"],
      false,
      "recording.mp3"
    );

    const request = createTranscription.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(request.known_speaker_names).toBeUndefined();
    expect(request.known_speaker_references).toBeUndefined();
    expect(result.segments.map((segment) => segment.speaker)).toEqual([
      "Alice",
      "Bob",
    ]);
    expect(result.speakers).toEqual(["Alice", "Bob"]);
  });

  it("sends known speaker names and references together when provided", async () => {
    createTranscription.mockResolvedValue({
      segments: [],
      text: "Hello World",
    });

    await transcribeAudioDiarized(
      Buffer.from("audio"),
      ["Alice"],
      false,
      "recording.mp3",
      ["data:audio/wav;base64,QUJD"]
    );

    const request = createTranscription.mock.calls[0]?.[0] as {
      extra_body?: Record<string, unknown>;
    };
    expect(request.extra_body).toEqual({
      known_speaker_names: ["Alice"],
      known_speaker_references: ["data:audio/wav;base64,QUJD"],
    });
  });

  it("throws when speaker names and references are not paired", async () => {
    await expect(
      transcribeAudioDiarized(
        Buffer.from("audio"),
        ["Alice", "Bob"],
        false,
        "recording.mp3",
        ["data:audio/wav;base64,QUJD"]
      )
    ).rejects.toThrow("same number");
    expect(createTranscription).not.toHaveBeenCalled();
  });
});
