import type { Command } from "commander";
import { convertTweet } from "../converters/tweet.js";
import { createUrlCommand } from "../utils/command.js";

const WWW_PREFIX_RE = /^www\./;
const TWEET_PATH_RE = /^\/[^/]+\/status(?:es)?\/\d+/;

function validateTweetUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(WWW_PREFIX_RE, "");
    if (hostname !== "twitter.com" && hostname !== "x.com") {
      return `Invalid tweet URL: expected twitter.com or x.com, got ${hostname}`;
    }
    if (!TWEET_PATH_RE.test(parsed.pathname)) {
      return "Invalid tweet URL: expected a /<user>/status/<id> path";
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
