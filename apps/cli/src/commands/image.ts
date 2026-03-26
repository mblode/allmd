import type { Command } from "commander";
import { convertImage } from "../converters/image.js";
import { createFileCommand } from "../utils/command.js";

export function registerImageCommand(program: Command): void {
  createFileCommand({
    name: "image",
    description: "Convert an image to markdown via AI vision",
    argument: "file",
    extensions: [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    converter: convertImage,
    spinnerText: "Analyzing image...",
    helpText: `Examples:
  allmd image screenshot.png
  allmd image photo.jpg -o description.md
  allmd image '*.png' -d output/`,
  })(program);
}
