import type { Command } from "commander";

import { convertDocx } from "../converters/docx.js";
import { createFileCommand } from "../utils/command.js";

export function registerDocxCommand(program: Command): void {
  createFileCommand({
    argument: "file",
    converter: convertDocx,
    description: "Convert a Word document to markdown",
    extensions: [".docx"],
    helpText: `Examples:
  allmd docx report.docx
  allmd docx report.docx -o report.md
  allmd docx '*.docx' -d output/`,
    name: "docx",
    spinnerText: "Extracting Word document content...",
  })(program);
}
