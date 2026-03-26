import type { Command } from "commander";
import { convertTweet } from "../converters/tweet.js";
import { createUrlCommand } from "../utils/command.js";

const WWW_PREFIX_RE = /^www\./;

function validateTweetUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace(WWW_PREFIX_RE, "");
    if (hostname !== "twitter.com" && hostname !== "x.com") {
      return `Invalid tweet URL: expected twitter.com or x.com, got ${hostname}`;
    }
    return null;
  } catch {
    return `Invalid URL: ${url}`;
  }
}

export function registerTweetCommand(program: Command): void {
  createUrlCommand({
    name: "tweet",
    description: "Convert a tweet/X post to markdown",
    argument: "url",
    converter: convertTweet,
    spinnerText: "Fetching tweet...",
    validate: validateTweetUrl,
    helpText: `Examples:
  allmd tweet https://twitter.com/user/status/123456
  allmd tweet https://x.com/user/status/123456 -o tweet.md`,
  })(program);
}
