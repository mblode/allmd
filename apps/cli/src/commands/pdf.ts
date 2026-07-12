import type { Command } from "commander";

import { convertPdf } from "../converters/pdf.js";
import { createFileCommand } from "../utils/command.js";

export function registerPdfCommand(program: Command): void {
  createFileCommand({
    argument: "file",
    converter: convertPdf,
    description: "Convert a PDF to markdown",
    extensions: [".pdf"],
    helpText: `Examples:
  allmd pdf document.pdf
  allmd pdf document.pdf -o output.md
  allmd pdf '*.pdf' -d output/`,
    name: "pdf",
    spinnerText: "Extracting PDF content...",
  })(program);
}
