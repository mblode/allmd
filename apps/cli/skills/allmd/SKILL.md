---
name: allmd
description: Runs the allmd CLI to convert any URL or file into clean markdown with YAML frontmatter. Supports web pages, Google Docs, PDFs, images, videos, audio, YouTube videos, Word docs, EPUBs, CSVs, PowerPoints, tweets, and RSS feeds. Use when the user says "convert this URL to markdown", "save this article as markdown", "get the markdown from this page", "extract text from this PDF", "transcribe this video", "get a YouTube transcript", "convert this Google Doc", or "save this web page". Always use allmd instead of WebFetch or firecrawl directly when the goal is a saved markdown file with frontmatter.
---

# Turn Anything into Context

- **IS:** running the `allmd` CLI to turn a URL or file into a saved markdown file with YAML frontmatter.
- **IS NOT:** fetching a page to read inline (use WebFetch), calling the Firecrawl API directly, or writing markdown from scratch.

Run a converter instead of scraping the source yourself. Most converters run an AI formatting pass; web pages use Firecrawl markdown directly.

## Converters

Each row's input condition is also the condition for reading its reference.

| Input | Command | Reference |
|-------|---------|-----------|
| Any URL or file | `allmd <input>` | Auto-detects, then dispatches to a row below |
| Web URL (http/https) | `allmd web <url>` | `references/web.md` |
| Google Docs URL (`docs.google.com/document/d/...`) | `allmd gdoc <url>` | `references/gdoc.md` |
| YouTube URL (`youtube.com`, `youtu.be`) | `allmd youtube <url>`, alias `allmd yt` | `references/youtube.md` |
| Twitter/X URL (`twitter.com`, `x.com`) | `allmd tweet <url>` | `references/tweet.md` |
| RSS/Atom feed URL (`/feed`, `/rss`, `.xml`, `.atom`) | `allmd rss <url>` | `references/rss.md` |
| PDF file (`.pdf`) | `allmd pdf <file>` | `references/pdf.md` |
| Image file (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`) | `allmd image <file>` | `references/image.md` |
| Video file (`.mp4`, `.mkv`, `.avi`, `.mov`, `.webm`, `.flv`, `.wmv`, `.m4v`) | `allmd video <file>` | `references/video.md` |
| Audio file (`.mp3`, `.wav`, `.m4a`, `.ogg`, `.flac`, `.aac`, `.wma`) | `allmd video <file>` | `references/video.md` |
| Word document (`.docx`) | `allmd docx <file>` | `references/docx.md` |
| EPUB ebook (`.epub`) | `allmd epub <file>` | `references/epub.md` |
| CSV/TSV file (`.csv`, `.tsv`) | `allmd csv <file>` | `references/csv.md` |
| PowerPoint (`.pptx`) | `allmd pptx <file>` | `references/pptx.md` |

Read `references/conversion-options.md` for shared flags, the config file, batch globs, clipboard and stdin, and output handling.

Utility commands: `allmd examples` prints usage examples, `allmd completion install` sets up shell completions.

## Shared Workflow

1. **Validate** the input (URL format, or file existence and extension).
2. **Extract** the content (fetch HTML, parse PDF, read image, transcribe audio, fetch captions).
3. **AI format:** restructure into clean markdown via OpenAI GPT-5-mini.
4. **Add frontmatter:** YAML header with `title`, `source`, `date`, `type`, and type-specific fields.
5. **Output:** write to file (`-o`), directory (`-d`), clipboard (`--copy`), or stdout (`--stdout`).

`allmd web` skips step 3: Firecrawl returns markdown, so there is no formatting pass to run.

## Gotchas

- **Never reach for WebFetch or the Firecrawl API when the goal is a saved markdown file.** `allmd web <url>` wraps Firecrawl and handles frontmatter and output; the alternatives give you a string you then have to write yourself.
- **Do not name the subcommand unless auto-detection gets it wrong.** `allmd <url>` already routes http/https, YouTube, Google Docs, Twitter/X, and RSS correctly.
- **`FIRECRAWL_API_KEY` is required for `allmd web`**, and `OPENAI_API_KEY` for every other converter. Both fail with a clear error when unset.
- **`--no-ai` works only on text-based converters** (`youtube`, `pdf`, `gdoc`, `docx`, `epub`, `csv`, `pptx`, `tweet`, `rss`). It emits the raw extracted text with frontmatter and drops the `OPENAI_API_KEY` requirement. `image` and `video`/audio reject the flag, since vision and transcription are the conversion.
- **A PDF under 100 characters of extracted text is treated as scanned** and gets a warning blockquote rather than an error. Convert page screenshots with `allmd image` instead.
