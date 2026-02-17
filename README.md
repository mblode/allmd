# allmd

Convert web pages, YouTube videos, PDFs, Google Docs, video/audio files, and images to markdown.

## Install

```bash
npm install -g allmd
```

Set your OpenAI API key:

```bash
export OPENAI_API_KEY=your-key
```

Requires Node.js 20+ and `ffmpeg` for video/audio (bundled via `ffmpeg-static`).

## Commands

Run `allmd` with no arguments for interactive mode.

```bash
allmd web https://example.com -o article.md
allmd youtube https://youtube.com/watch?v=dQw4w9WgXcQ -o transcript.md
allmd pdf document.pdf -o document.md
allmd gdoc https://docs.google.com/document/d/... -o doc.md
allmd video recording.mp4 -o transcript.md
allmd image screenshot.png -o description.md
```

## Options

```
-o, --output <file>   Write to a file instead of auto-generating
-V, --version         Show version
-h, --help            Show help
```

## API

```typescript
import { convertWeb, convertPdf, convertYoutube } from "allmd";

const result = await convertWeb("https://example.com", { ai: true });
console.log(result.markdown);
```

Available converters: `convertWeb`, `convertYoutube`, `convertPdf`, `convertGdoc`, `convertVideo`, `convertImage`.

## AI Agents

Add allmd as a skill for Claude Code, Cursor, Codex, and other AI coding assistants:

```bash
npx skills add mblode/allmd
```

## License

[MIT](LICENSE.md)
