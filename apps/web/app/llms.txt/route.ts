import { siteConfig } from "@/lib/config";

const body = `# ${siteConfig.name}

> Everything is context. ${siteConfig.description}

A talk, a post, a PDF, a recording. allmd is a command-line tool and Node.js library that converts any of it into clean markdown. It auto-detects the input type, uses AI to tidy the output, and writes to a file, directory, clipboard, or stdout. It also ships as a skill for Claude Code, Cursor, and Codex, so the agent converts instead of scraping.

## Documentation

- [Documentation](${siteConfig.links.docs}): Guides for the CLI, Node.js API, and agent skill.
- [CLI reference](${siteConfig.links.docs}/cli): Commands, flags, and supported formats.
- [Node.js API](${siteConfig.links.docs}/api): Import converters directly in TypeScript.

## Site

- [Homepage as markdown](${siteConfig.url}/home.md): The landing page rendered as clean markdown.

## Source

- [GitHub repository](${siteConfig.links.github}): Source code, issues, and releases.
- [npm package](${siteConfig.links.npm}): Install with \`npm install -g allmd\`.

## Agents

- [Agent skills index](${siteConfig.url}/.well-known/agent-skills/index.json): Machine-readable skill discovery manifest. Add the skill with \`npx skills add mblode/allmd\`.
`;

export const dynamic = "force-static";

export function GET(): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
