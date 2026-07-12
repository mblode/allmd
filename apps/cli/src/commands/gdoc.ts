import type { Command } from "commander";

import { convertGdoc } from "../converters/gdoc.js";
import { createUrlCommand } from "../utils/command.js";

export function registerGdocCommand(program: Command): void {
  createUrlCommand({
    argument: "url",
    converter: convertGdoc,
    description: "Convert a public Google Doc to markdown",
    helpText: `Examples:
  allmd gdoc https://docs.google.com/document/d/1abc.../edit
  allmd gdoc https://docs.google.com/document/d/1abc... -o doc.md`,
    name: "gdoc",
    spinnerText: "Fetching Google Doc...",
  })(program);
}
