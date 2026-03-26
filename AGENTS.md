# allmd

CLI tool that converts web pages, YouTube videos, PDFs, Google Docs, video/audio, images, Word docs, EPUBs, CSVs, PowerPoints, tweets, and RSS feeds into markdown.

## Monorepo Structure

Turborepo with npm workspaces:
- `apps/cli/` — CLI tool published to npm as `allmd`
- `apps/web/` — Landing page (Next.js 16, deployed to Vercel)

## Commands

```bash
npm install              # setup (requires Node >= 20)
npm run build            # turbo build (all apps)
npm run dev              # turbo dev (all apps)
npm run test             # turbo test
npm run check            # ultracite check
npm run fix              # ultracite fix
```

### CLI-specific (from apps/cli/)

```bash
cd apps/cli
npm run build            # tsup → dist/
npm run dev              # tsup --watch
npm run test             # vitest run
npm run check-types      # tsc --noEmit
```

### Web-specific (from apps/web/)

```bash
cd apps/web
npm run dev              # next dev
npm run build            # next build
```

## Environment

Requires `OPENAI_API_KEY` in `apps/cli/.env` or environment for AI-backed converters — used by `apps/cli/src/ai/client.ts` for GPT-5-mini formatting, image description, and Whisper transcription. Web page conversion requires `FIRECRAWL_API_KEY`. Video/audio conversion requires `ffmpeg` on PATH (bundled via `ffmpeg-static`).

## Architecture

CLI entry point: `apps/cli/src/cli.ts` (Commander). Public API: `apps/cli/src/index.ts`. Each converter has a matching pair in `apps/cli/src/commands/` and `apps/cli/src/converters/`. AI client at `apps/cli/src/ai/client.ts`. Untyped deps declared in `apps/cli/src/vendor.d.ts`. Skill definition in `apps/cli/skills/allmd/`.

Converters (12): web, youtube, pdf, gdoc, video (also handles audio), image, docx, epub, csv, pptx, tweet, rss. Utility commands: examples, completion. Auto-detection in `apps/cli/src/utils/detect.ts`.

Most converters follow: validate → extract → AI format → add frontmatter → output. Web pages use Firecrawl markdown directly and skip the AI-format step.

## Adding a New Converter

1. Create `apps/cli/src/converters/<name>.ts` exporting `convert<Name>(input, options): Promise<ConversionResult>`
2. Create `apps/cli/src/commands/<name>.ts` exporting `register<Name>Command(program)` — wire converter + spinner + writeOutput
3. Register in `apps/cli/src/cli.ts` and export from `apps/cli/src/index.ts`
4. Add skill reference in `apps/cli/skills/allmd/references/<name>.md` and update `apps/cli/skills/allmd/SKILL.md` dispatch table

## Gotchas

- **`vendor.d.ts`**: `pdf-parse`, `ffmpeg-extract-audio`, and `turndown-plugin-gfm` have no published types. Hand-written declarations live in `apps/cli/src/vendor.d.ts`. Update these if you upgrade those packages.
- **AI is on for most converters**: Web pages use Firecrawl markdown directly. Other converters still use AI formatting, and there is no `--no-ai` flag. Tests that exercise converters will make API calls unless mocked.
- **Skill structure changed**: The old per-converter skill directories were consolidated into a single `skills/allmd/` directory. Don't recreate per-converter skill directories.
- **Publishing**: The `allmd` npm package is published from `apps/cli/`. Run `npm run release` from root to build and publish via changesets.
