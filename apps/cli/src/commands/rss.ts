import type { Command } from "commander";

import { convertRss } from "../converters/rss.js";
import { createUrlCommand } from "../utils/command.js";

export function registerRssCommand(program: Command): void {
  createUrlCommand({
    argument: "url",
    converter: convertRss,
    description: "Convert an RSS or Atom feed to markdown",
    helpText: `Examples:
  allmd rss https://example.com/feed.xml
  allmd rss https://example.com/rss -o feed.md`,
    name: "rss",
    spinnerText: "Fetching feed...",
  })(program);
}
