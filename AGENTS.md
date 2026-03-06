# allmd

CLI tool that converts web pages, YouTube videos, PDFs, Google Docs, video/audio, images, Word docs, EPUBs, CSVs, PowerPoints, tweets, and RSS feeds into markdown.

## Commands

```bash
npm install              # setup (requires Node >= 20)
npm run build            # tsup → dist/
npm run dev              # tsup --watch
npm run test             # vitest run
npm run typecheck        # tsc --noEmit
npm exec -- ultracite fix   # format + lint autofix
npm exec -- ultracite check # lint check (CI)
```

## Environment

Requires `OPENAI_API_KEY` in `.env` or environment for AI-backed converters — used by `src/ai/client.ts` for GPT-5-mini formatting, image description, and Whisper transcription. Web page conversion requires `FIRECRAWL_API_KEY`. Video/audio conversion requires `ffmpeg` on PATH (bundled via `ffmpeg-static`).

## Architecture

Entry point: `src/cli.ts` (Commander). Public API: `src/index.ts`. Each converter has a matching pair in `src/commands/` and `src/converters/`. AI client at `src/ai/client.ts`. Untyped deps declared in `src/vendor.d.ts`. Skill definition in `skills/allmd/`.

Converters (12): web, youtube, pdf, gdoc, video (also handles audio), image, docx, epub, csv, pptx, tweet, rss. Utility commands: examples, completion. Auto-detection in `src/utils/detect.ts`.

Most converters follow: validate → extract → AI format → add frontmatter → output. Web pages use Firecrawl markdown directly and skip the AI-format step.

## Adding a New Converter

1. Create `src/converters/<name>.ts` exporting `convert<Name>(input, options): Promise<ConversionResult>`
2. Create `src/commands/<name>.ts` exporting `register<Name>Command(program)` — wire converter + spinner + writeOutput
3. Register in `src/cli.ts` and export from `src/index.ts`
4. Add skill reference in `skills/allmd/references/<name>.md` and update `skills/allmd/SKILL.md` dispatch table

## Gotchas

- **`vendor.d.ts`**: `pdf-parse`, `ffmpeg-extract-audio`, and `turndown-plugin-gfm` have no published types. Hand-written declarations live in `src/vendor.d.ts`. Update these if you upgrade those packages.
- **AI is on for most converters**: Web pages use Firecrawl markdown directly. Other converters still use AI formatting, and there is no `--no-ai` flag. Tests that exercise converters will make API calls unless mocked.
- **Skill structure changed**: The old per-converter skill directories were consolidated into a single `skills/allmd/` directory. Don't recreate per-converter skill directories.
