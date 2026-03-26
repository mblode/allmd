import type { Command } from "commander";
import { convertWeb } from "../converters/web.js";
import { createUrlCommand } from "../utils/command.js";

export function registerWebCommand(program: Command): void {
  createUrlCommand({
    name: "web",
    description: "Convert a website to markdown with Firecrawl",
    argument: "url",
    converter: convertWeb,
    requiresFirecrawl: true,
    requiresOpenAI: false,
    spinnerText: "Fetching & converting web page...",
    helpText: `Examples:
  allmd web https://example.com
  allmd web https://example.com -o article.md
  echo 'https://example.com' | allmd web

Requires FIRECRAWL_API_KEY for web extraction. Web pages use Firecrawl markdown directly and do not require OPENAI_API_KEY.`,
  })(program);
}
