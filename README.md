<h1 align="center">allmd</h1>

<p align="center">Turn the whole universe into markdown.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/allmd"><img src="https://img.shields.io/npm/v/allmd.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/allmd"><img src="https://img.shields.io/npm/dm/allmd.svg" alt="npm downloads"></a>
  <a href="LICENSE.md"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://github.com/mblode/allmd"><img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg" alt="Node >= 20"></a>
</p>



- **Web pages:** fetch any URL and convert to clean markdown with Readability.
- **YouTube videos:** extract transcripts with timestamps.
- **PDFs:** parse text content from PDF files.
- **Google Docs:** convert published Google Docs to markdown.
- **Video/audio:** transcribe media files using Whisper.
- **Images:** describe images using GPT vision.
- **Word documents:** convert `.docx` files to markdown.
- **EPUB ebooks:** convert `.epub` files to markdown.
- **CSV/TSV files:** convert tabular data to markdown tables.
- **PowerPoint:** convert `.pptx` presentations to markdown.
- **Tweets:** capture tweets/X posts as markdown.
- **RSS/Atom feeds:** convert feed entries to markdown.
- **Auto-detect:** pass any URL or file — allmd figures out the type automatically.
- **AI formatting:** all output is polished with GPT for consistent, readable markdown.
- **Interactive mode:** run `allmd` with no arguments to pick a converter.

## Installation

```bash
npm install -g allmd
```

Set your OpenAI API key:

```bash
export OPENAI_API_KEY=your-key
```

Requires Node.js 20+ and `ffmpeg` for video/audio (bundled via `ffmpeg-static`).

## Usage

Run `allmd` with no arguments for interactive mode, or pass any URL/file for auto-detection.

```bash
allmd https://example.com                       # auto-detect input type
allmd web https://example.com -o article.md
allmd youtube https://youtube.com/watch?v=dQw4w9WgXcQ -o transcript.md
allmd pdf document.pdf -o document.md
allmd gdoc https://docs.google.com/document/d/... -o doc.md
allmd video recording.mp4 -o transcript.md
allmd image screenshot.png -o description.md
allmd docx report.docx -o report.md
allmd epub book.epub -o book.md
allmd csv data.csv -o data.md
allmd pptx slides.pptx -o slides.md
allmd tweet https://x.com/user/status/123 -o tweet.md
allmd rss https://blog.example.com/feed -o feed.md
allmd examples                                  # show more usage examples
```

## Options

```
-o, --output <file>      Write output to a specific file
-d, --output-dir <dir>   Output directory for converted files
-v, --verbose            Enable verbose output
-c, --clipboard          Read input from clipboard
    --copy               Copy output to clipboard
    --stdout             Print output to stdout instead of writing a file
    --parallel <n>       Number of parallel conversions (default: 3)
    --no-frontmatter     Skip YAML frontmatter in output
-V, --version            Show version
-h, --help               Show help
```

## API

```typescript
import { convertWeb, convertPdf, convertYoutube } from "allmd";

const result = await convertWeb("https://example.com");
console.log(result.markdown);
```

Available converters: `convertWeb`, `convertYoutube`, `convertPdf`, `convertGdoc`, `convertVideo`, `convertImage`, `convertDocx`, `convertEpub`, `convertCsv`, `convertPptx`, `convertTweet`, `convertRss`.

## AI Agents

Add allmd as a skill for Claude Code, Cursor, Codex, and other AI coding assistants:

```bash
npx skills add mblode/allmd
```

## License

[MIT](LICENSE.md)
