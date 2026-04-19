import { siteConfig } from "@/lib/config";

const markdown = `# ${siteConfig.name}

Turn the whole universe into markdown.

${siteConfig.description}

## Install

\`\`\`bash
npm install -g allmd
\`\`\`

## Convert

\`\`\`bash
allmd https://example.com
\`\`\`

## Features

- **Auto-detect** — pass any URL or file path. allmd figures out the type.
- **AI formatting** — AI cleans up the output into consistent, readable markdown.
- **12 formats** — web, YouTube, PDF, Google Docs, video, audio, images, Word, EPUB, CSV, PowerPoint, tweets, RSS.
- **Flexible output** — write to file, directory, clipboard, or stdout.
- **Frontmatter** — every file gets a YAML header with title, source, date, and more.
- **Agent skill** — works with Claude Code, Cursor, and other AI coding agents.

## Node.js API

\`\`\`ts
import { convertWeb } from "allmd";

const { markdown } = await convertWeb("https://example.com");
\`\`\`

## AI agent skill

Give your AI coding agent the ability to convert anything to markdown.

\`\`\`bash
npx skills add mblode/allmd
\`\`\`

\`\`\`bash
/allmd https://youtu.be/dQw4w9WgXcQ
\`\`\`

## Links

- Documentation: ${siteConfig.links.docs}
- npm: ${siteConfig.links.npm}
- GitHub: ${siteConfig.links.github}
- Agent skills discovery: ${siteConfig.url}/.well-known/agent-skills/index.json
`;

const tokenCount = markdown.split(/\s+/).filter(Boolean).length;

export const dynamic = "force-static";

export function GET(): Response {
  return new Response(markdown, {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
      "x-markdown-tokens": String(tokenCount),
    },
  });
}
