import { siteConfig } from "@/lib/config";

const markdown = `# ${siteConfig.name}

Everything is context.

A talk, a post, a PDF, a recording. One command turns any of it into markdown.

## Agent skill

Install once. Your agent converts instead of scraping. Claude Code, Cursor, Codex.

\`\`\`bash
npx skills add mblode/allmd
\`\`\`

\`\`\`bash
/allmd https://youtu.be/dQw4w9WgXcQ
\`\`\`

## Twelve sources, one command

- **Auto-detect:** pass any URL or file path. allmd figures out the type.
- **AI formatting:** AI cleans up the output into consistent, readable markdown.
- **12 formats:** web, YouTube, PDF, Google Docs, video and audio, images, Word, EPUB, CSV, PowerPoint, tweets, RSS.
- **Flexible output:** write to file, directory, clipboard, or stdout.
- **Frontmatter:** a YAML header on every file with the title, source, date, and type.
- **No API key:** \`--no-ai\` emits the raw extracted text. Faster, offline, and no \`OPENAI_API_KEY\`.

## Install

\`\`\`bash
npm install -g allmd
\`\`\`

## Convert

\`\`\`bash
allmd https://example.com
\`\`\`

## Node.js API

\`\`\`ts
import { convertWeb } from "allmd";

const { markdown } = await convertWeb("https://example.com");
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
