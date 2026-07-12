import type { Command } from "commander";

import { convertEpub } from "../converters/epub.js";
import { createFileCommand } from "../utils/command.js";

export function registerEpubCommand(program: Command): void {
  createFileCommand({
    argument: "file",
    converter: convertEpub,
    description: "Convert an EPUB ebook to markdown",
    extensions: [".epub"],
    helpText: `Examples:
  allmd epub book.epub
  allmd epub book.epub -o book.md`,
    name: "epub",
    spinnerText: "Extracting EPUB content...",
  })(program);
}
