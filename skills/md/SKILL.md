---
name: md
description: Converts content to clean markdown. Supports web pages, Google Docs, PDFs, images, videos, audio files, and YouTube videos. Use when the user wants to convert a URL to markdown, extract text from a PDF or image, transcribe a video or audio file, save a web article, export a Google Doc, or get a YouTube transcript.
---

# Convert Anything to Markdown

A CLI tool that converts web pages, Google Docs, PDFs, images, video/audio files, and YouTube videos into clean markdown with optional AI formatting.

## Reference Files

| File | Read when |
|------|-----------|
| `references/conversion-options.md` | You need details on shared types, CLI flags, AI formatting, or output options |
| `references/web.md` | Converting a web page URL |
| `references/gdoc.md` | Converting a Google Doc |
| `references/pdf.md` | Converting a PDF file |
| `references/image.md` | Converting an image file |
| `references/video.md` | Converting a video or audio file |
| `references/youtube.md` | Converting a YouTube video |

## Dispatch Table

| Input | Command | Reference |
|-------|---------|-----------|
| Web URL (http/https) | `md web <url>` | `references/web.md` |
| Google Docs URL (`docs.google.com/document/d/...`) | `md gdoc <url>` | `references/gdoc.md` |
| YouTube URL (`youtube.com`, `youtu.be`) | `md youtube <url>` or `md yt <url>` | `references/youtube.md` |
| PDF file (`.pdf`) | `md pdf <file>` | `references/pdf.md` |
| Image file (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`) | `md image <file>` | `references/image.md` |
| Video file (`.mp4`, `.mkv`, `.avi`, `.mov`, `.webm`, `.flv`, `.wmv`, `.m4v`) | `md video <file>` | `references/video.md` |
| Audio file (`.mp3`, `.wav`, `.m4a`, `.ogg`, `.flac`, `.aac`, `.wma`) | `md video <file>` | `references/video.md` |

## Shared Workflow

All converters follow this pattern:

1. **Validate** input (URL format or file existence/extension)
2. **Extract** content (fetch HTML, parse PDF, read image, transcribe audio, fetch captions)
3. **AI format** (optional, default ON) — restructures into clean markdown via OpenAI GPT-4o
4. **Add frontmatter** — YAML header with title, source, date, type, and type-specific fields
5. **Output** — write to file (`-o`) or stdout

## CLI Quick Reference

All commands accept `-o <file>` and `--no-ai` flags.

| Command | Example |
|---------|---------|
| `md web <url>` | `md web https://example.com/article` |
| `md gdoc <url>` | `md gdoc "https://docs.google.com/document/d/abc123/edit"` |
| `md youtube <url>` | `md yt https://youtu.be/dQw4w9WgXcQ` |
| `md pdf <file>` | `md pdf report.pdf -o report.md` |
| `md image <file>` | `md image screenshot.png` |
| `md video <file>` | `md video recording.mp4 --no-ai` |
