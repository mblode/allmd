import type { Command } from "commander";
import { convertEpub } from "../converters/epub.js";
import { createFileCommand } from "../utils/command.js";

export function registerEpubCommand(program: Command): void {
  createFileCommand({
    name: "epub",
    description: "Convert an EPUB ebook to markdown",
    argument: "file",
    extensions: [".epub"],
    converter: convertEpub,
    spinnerText: "Extracting EPUB content...",
    helpText: `Examples:
  allmd epub book.epub
  allmd epub book.epub -o book.md`,
  })(program);
}
