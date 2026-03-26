import type { Command } from "commander";
import { convertYoutube } from "../converters/youtube.js";
import { createUrlCommand } from "../utils/command.js";

export function registerYoutubeCommand(program: Command): void {
  createUrlCommand({
    name: "youtube",
    description: "Convert a YouTube video transcript to markdown",
    argument: "url",
    converter: convertYoutube,
    spinnerText: "Fetching transcript...",
    aliases: ["yt"],
    helpText: `Examples:
  allmd youtube https://www.youtube.com/watch?v=dQw4w9WgXcQ
  allmd yt https://youtu.be/dQw4w9WgXcQ -o transcript.md`,
  })(program);
}
