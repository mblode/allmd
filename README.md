# md-tools

CLI tool that converts web pages, YouTube videos, PDFs, Google Docs, video/audio files, and images into markdown.

## Features

- **6 Converters** - Web pages, YouTube transcripts, PDFs, Google Docs, video/audio, and images
- **AI-Powered Formatting** - Cleans and structures output using OpenAI (GPT-5-mini)
- **Full Content Preservation** - Retains all source content without summarizing or condensing
- **Interactive Mode** - Run `md` with no arguments to be guided through conversion
- **Programmatic API** - Import converters directly in TypeScript/JavaScript
- **AI Agent Skill** - Works with Claude Code, Codex, Cursor, and other AI coding assistants

## Requirements

- **Node.js** 20+
- **OPENAI_API_KEY** environment variable (for AI features)
- **ffmpeg** for video/audio transcription (bundled via `ffmpeg-static`)

## Setup

### 1. Install

```bash
npm install -g md-tools
```

Or use directly with npx:

```bash
npx md-tools web https://example.com
```

### 2. Set your API key

```bash
export OPENAI_API_KEY=your-key
```

Or create a `.env` file in the project root:

```
OPENAI_API_KEY=your-key
```

## Usage

### Interactive mode

Run `md` with no arguments:

```bash
md
```

You'll be prompted to select a conversion type and provide input.

### Commands

#### Web

```bash
md web <url>
md web https://example.com -o output.md
```

#### YouTube

```bash
md youtube <url>
md yt https://youtube.com/watch?v=... -o output.md
```

#### PDF

```bash
md pdf <file>
md pdf document.pdf -o output.md
```

#### Google Docs

```bash
md gdoc <url>
```

The document must be publicly shared.

#### Video / Audio

```bash
md video <file>
md video recording.mp4 -o output.md
```

Requires ffmpeg (bundled automatically).

#### Image

```bash
md image <file>
md image screenshot.png -o output.md
```

### Options

```
-o, --output <file>   Write output to a file instead of auto-generating
-V, --version         Show version number
-h, --help            Show help
```

### Examples

```bash
# Convert a web page
md web https://example.com

# Convert a PDF with custom output path
md pdf whitepaper.pdf -o whitepaper.md

# Describe an image
md image diagram.png -o diagram.md
```

## Programmatic API

```typescript
import { convertWeb, convertPdf, convertYoutube } from "md-tools";

const result = await convertWeb("https://example.com", { ai: true });
console.log(result.markdown);
```

### Converter functions

- `convertWeb(url, options)` - Convert a website URL
- `convertYoutube(url, options)` - Convert a YouTube video transcript
- `convertPdf(file, options)` - Convert a PDF file
- `convertGdoc(url, options)` - Convert a Google Doc
- `convertVideo(file, options)` - Convert a video/audio file
- `convertImage(file, options)` - Convert an image

### Utility functions

- `htmlToMarkdown(html)` - Convert HTML string to markdown
- `extractReadableContent(html)` - Extract readable content from HTML
- `extractVideoId(url)` - Extract YouTube video ID from URL
- `extractDocId(url)` - Extract Google Doc ID from URL
- `addFrontmatter(markdown, data)` - Add YAML frontmatter to markdown
- `parseFrontmatter(markdown)` - Parse YAML frontmatter from markdown
- `generateOutputPath(title)` - Generate an output file path from a title
- `slugify(text)` - Convert text to a URL-friendly slug

## Usage with AI Agents

### Just ask the agent

```
Use md-tools to convert this PDF to markdown. Run md --help to see available commands.
```

### AI Coding Assistants

Add the skill to your AI coding assistant:

```bash
npx skills add mblode/md-tools
```

This works with Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, Goose, OpenCode, and Windsurf.

### AGENTS.md / CLAUDE.md

For more consistent results, add to your project or global instructions file:

```markdown
## Markdown Conversion

Use `md-tools` to convert content to markdown. Run `md --help` for all commands.

Core commands:
- `md web <url>` - Convert web page
- `md pdf <file>` - Convert PDF
- `md youtube <url>` - Convert YouTube transcript
- `md gdoc <url>` - Convert Google Doc
- `md video <file>` - Transcribe video/audio
- `md image <file>` - Describe image
```

## Contributing

```bash
git clone https://github.com/mblode/md-tools.git
cd md-tools
npm install
npm run build
npm run test
```

## License

[MIT](LICENSE.md)
