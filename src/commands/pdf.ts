import type { Command } from "commander";
import { convertPdf } from "../converters/pdf.js";
import { createFileCommand } from "../utils/command.js";

export function registerPdfCommand(program: Command): void {
  createFileCommand({
    name: "pdf",
    description: "Convert a PDF to markdown",
    argument: "file",
    extensions: [".pdf"],
    converter: convertPdf,
    spinnerText: "Extracting PDF content...",
    helpText: `Examples:
  allmd pdf document.pdf
  allmd pdf document.pdf -o output.md
  allmd pdf '*.pdf' -d output/`,
  })(program);
}
