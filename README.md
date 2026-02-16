# md-tools

CLI tool to convert various content types to markdown.

Supports websites, YouTube videos, PDFs, Google Docs, video/audio files, and images — with optional AI-powered formatting.

## Installation

```bash
npm install -g md-tools
```

Or use directly with npx:

```bash
npx md-tools web https://example.com
```

## Setup

### AI Features

AI formatting requires an API key for the [Vercel AI Gateway](https://ai-gateway.vercel.sh):

```bash
export AI_GATEWAY_API_KEY=your-key
```

Optionally override the gateway URL:

```bash
export AI_GATEWAY_URL=https://your-gateway.example.com
```

Use `--no-ai` to skip AI formatting and get raw conversions.

## Usage

### Interactive Mode

Run `md` with no arguments to enter interactive mode:

```bash
md
```

### Commands

#### Web

Convert a website to markdown:

```bash
md web <url>
md web https://example.com -o output.md
```

#### YouTube

Convert a YouTube video transcript to markdown:

```bash
md youtube <url>
md yt https://youtube.com/watch?v=... -o output.md
```

#### PDF

Convert a PDF file to markdown:

```bash
md pdf <file>
md pdf document.pdf -o output.md
```

#### Google Docs

Convert a Google Doc to markdown:

```bash
md gdoc <url>
```

#### Video / Audio

Convert a video or audio file to markdown via transcription:

```bash
md video <file>
```

#### Image

Convert an image to markdown via AI description:

```bash
md image <file>
```

### Global Options

| Option | Description |
|---|---|
| `-o, --output <file>` | Write output to a file instead of stdout |
| `--no-ai` | Skip AI formatting (raw conversion only) |
| `-V, --version` | Show version number |
| `-h, --help` | Show help |

## Programmatic API

```typescript
import { convertWeb, convertYoutube, convertPdf } from "md-tools";

const result = await convertWeb("https://example.com", { ai: true });
console.log(result.markdown);
```

### Converter Functions

- `convertWeb(url, options)` — Convert a website URL
- `convertYoutube(url, options)` — Convert a YouTube video transcript
- `convertPdf(file, options)` — Convert a PDF file
- `convertVideo(file, options)` — Convert a video/audio file
- `convertImage(file, options)` — Convert an image
- `convertGdoc(url, options)` — Convert a Google Doc

### Utility Functions

- `htmlToMarkdown(html)` — Convert HTML string to markdown
- `extractReadableContent(html)` — Extract readable content from HTML
- `extractVideoId(url)` — Extract YouTube video ID from URL
- `extractDocId(url)` — Extract Google Doc ID from URL
- `addFrontmatter(markdown, data)` — Add YAML frontmatter to markdown
- `parseFrontmatter(markdown)` — Parse YAML frontmatter from markdown
- `generateOutputPath(title)` — Generate an output file path from a title
- `slugify(text)` — Convert text to a URL-friendly slug

## Usage with AI Agents

### AI Coding Assistants

Add the skill to your AI coding assistant:

```bash
npx skills add mblode/md-tools
```

This works with Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, Goose, OpenCode, and Windsurf.

## Requirements

- Node.js >= 20
- `AI_GATEWAY_API_KEY` for AI features
- `ffmpeg` for video/audio transcription

## License

[MIT](LICENSE.md)
