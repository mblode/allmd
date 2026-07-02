# allmd

CLI tool that converts web pages, YouTube videos, PDFs, Google Docs, video/audio, images, Word docs, EPUBs, CSVs, PowerPoints, tweets, and RSS feeds into markdown.

## Monorepo Structure

Turborepo with npm workspaces (`apps/*` — a directory joins the workspace only if it has a `package.json`):
- `apps/cli/` — CLI tool published to npm as `allmd` (lints with Biome)
- `apps/web/` — Landing page (Next.js 16, deployed to Vercel; lints with oxlint)
- `apps/docs/` — MDX documentation source (Blode.md `docs.json` schema, deployed to Vercel on its own). No `package.json`, so it is not part of the Turborepo build or npm workspaces.

## Commands

```bash
npm install              # setup (requires Node >= 20)
npm run build            # turbo build (all apps)
npm run dev              # turbo dev (all apps)
npm run test             # turbo test (vitest in apps/cli)
npm run lint             # turbo lint (Biome in apps/cli, oxlint in apps/web)
npm run typecheck        # turbo check-types (tsc --noEmit)
npm run check            # ultracite check (Biome-based format + lint, whole repo)
npm run fix              # ultracite fix
```

Root lint/format is driven by ultracite (Biome) via `biome.jsonc`; `npm run lint`/`npm run typecheck` fan out to each app's own tooling through Turbo.

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

- **`vendor.d.ts`**: `pdf-parse`, `mammoth`, `epub2`, `rss-parser`, `update-notifier`, `tabtab`, and `turndown-plugin-gfm` ship without usable published types, so hand-written declarations live in `apps/cli/src/vendor.d.ts`. Update these if you upgrade those packages.
- **AI is on by default for most converters**: Web pages use Firecrawl markdown directly. Other converters run AI formatting by default; pass `--no-ai` to skip it and emit raw extracted text for text-based sources (PDF, docx, epub, csv, pptx, gdoc, etc.). Image and video/audio inherently need AI (vision / transcription) and reject `--no-ai` with an error. Tests that exercise converters will make API calls unless mocked.
- **Skill structure changed**: The old per-converter skill directories were consolidated into a single `skills/allmd/` directory. Don't recreate per-converter skill directories.
- **Publishing**: The `allmd` npm package is published from `apps/cli/`. Run `npm run release` from root to build and publish via changesets.

## Working with allmd

When assisting in this project, run `allmd` CLI commands rather than using WebFetch or Firecrawl APIs directly:

- **Any URL or file**: `allmd <input>` (auto-detects type)
- **Web page**: `allmd web <url>`
- **File**: `allmd <file>` (auto-detects by extension)

Use `allmd` for all URL-to-markdown and file-to-markdown tasks. Reserve WebFetch for cases where the raw HTTP response (not markdown) is needed.
