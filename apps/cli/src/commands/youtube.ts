import type { Command } from "commander";

import { convertYoutube } from "../converters/youtube.js";
import { createUrlCommand } from "../utils/command.js";

export function registerYoutubeCommand(program: Command): void {
  createUrlCommand({
    aliases: ["yt"],
    argument: "url",
    converter: convertYoutube,
    description: "Convert a YouTube video transcript to markdown",
    helpText: `Examples:
  allmd youtube https://www.youtube.com/watch?v=dQw4w9WgXcQ
  allmd yt https://youtu.be/dQw4w9WgXcQ -o transcript.md`,
    name: "youtube",
    spinnerText: "Fetching transcript...",
  })(program);
}
