import type { Command } from "commander";

import { convertImage } from "../converters/image.js";
import { createFileCommand } from "../utils/command.js";

export function registerImageCommand(program: Command): void {
  createFileCommand({
    argument: "file",
    converter: convertImage,
    description: "Convert an image to markdown via AI vision",
    extensions: [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    helpText: `Examples:
  allmd image screenshot.png
  allmd image photo.jpg -o description.md
  allmd image '*.png' -d output/`,
    name: "image",
    spinnerText: "Analyzing image...",
  })(program);
}
