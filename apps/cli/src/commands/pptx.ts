import type { Command } from "commander";

import { convertPptx } from "../converters/pptx.js";
import { createFileCommand } from "../utils/command.js";

export function registerPptxCommand(program: Command): void {
  createFileCommand({
    argument: "file",
    converter: convertPptx,
    description: "Convert a PowerPoint presentation to markdown",
    extensions: [".pptx"],
    helpText: `Examples:
  allmd pptx slides.pptx
  allmd pptx presentation.pptx -o slides.md`,
    name: "pptx",
    spinnerText: "Extracting slide content...",
  })(program);
}
