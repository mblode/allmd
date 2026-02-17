import type { Command } from "commander";
import { convertWeb } from "../converters/web.js";
import { createUrlCommand } from "../utils/command.js";

export function registerWebCommand(program: Command): void {
  createUrlCommand({
    name: "web",
    description: "Convert a website to markdown",
    argument: "url",
    converter: convertWeb,
    spinnerText: "Fetching & converting web page...",
    helpText: `Examples:
  allmd web https://example.com
  allmd web https://example.com -o article.md
  echo 'https://example.com' | allmd web`,
  })(program);
}
