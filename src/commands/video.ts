import type { Command } from "commander";
import { convertVideo } from "../converters/video.js";
import { createFileCommand } from "../utils/command.js";

export function registerVideoCommand(program: Command): void {
  createFileCommand({
    name: "video",
    description: "Convert a video/audio file to markdown via transcription",
    argument: "file",
    extensions: [".mp4", ".mp3", ".wav", ".m4a", ".webm", ".ogg"],
    converter: convertVideo,
    spinnerText: "Transcribing & formatting with AI...",
    helpText: `Examples:
  allmd video recording.mp4
  allmd video podcast.mp3 -o transcript.md
  allmd video '*.mp4' -d transcripts/`,
  })(program);
}
