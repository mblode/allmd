import type { Command } from "commander";
import { convertPptx } from "../converters/pptx.js";
import { createFileCommand } from "../utils/command.js";

export function registerPptxCommand(program: Command): void {
  createFileCommand({
    name: "pptx",
    description: "Convert a PowerPoint presentation to markdown",
    argument: "file",
    extensions: [".pptx"],
    converter: convertPptx,
    spinnerText: "Extracting slide content...",
    helpText: `Examples:
  allmd pptx slides.pptx
  allmd pptx presentation.pptx -o slides.md`,
  })(program);
}
