import type { Command } from "commander";
import { convertDocx } from "../converters/docx.js";
import { createFileCommand } from "../utils/command.js";

export function registerDocxCommand(program: Command): void {
  createFileCommand({
    name: "docx",
    description: "Convert a Word document to markdown",
    argument: "file",
    extensions: [".docx", ".doc"],
    converter: convertDocx,
    spinnerText: "Extracting Word document content...",
    helpText: `Examples:
  allmd docx report.docx
  allmd docx report.docx -o report.md
  allmd docx '*.docx' -d output/`,
  })(program);
}
