# allmd

Monorepo for `allmd`, a CLI that converts web pages, YouTube videos, PDFs, Google Docs, video and audio, images, Word docs, EPUBs, CSVs, PowerPoints, tweets, and RSS feeds into markdown.

## Workspaces

| Path | What it contains | Notes |
| --- | --- | --- |
| [`apps/cli`](apps/cli) | Published `allmd` npm package and programmatic API | See [`apps/cli/README.md`](apps/cli/README.md) for install and converter usage. |
| [`apps/web`](apps/web) | Next.js 16 marketing site | Landing page for allmd and redirect layer for hosted docs. |
| [`apps/docs`](apps/docs) | MDX docs source | Installation, usage, API, skills, and per-converter docs. |

## Getting Started

```bash
git clone https://github.com/mblode/allmd.git
cd allmd
npm install
npm run build
```

Requires Node.js 20+.

## Development

Run these commands from the repository root:

```bash
npm run dev
npm run build
npm run test
npm run check
npm run fix
```

CLI package commands:

```bash
cd apps/cli
npm run build
npm run test
npm run test:e2e
npm run check-types
```

The CLI E2E suite builds and packs `apps/cli`, installs the tarball into an isolated temporary global npm prefix, and exercises the installed `allmd` binary. Use `npm run test:e2e:live` with `OPENAI_API_KEY` and `FIRECRAWL_API_KEY` to include live conversion smoke tests.

Web app commands:

```bash
cd apps/web
npm run dev
npm run build
npm run check
```

## Environment

- `OPENAI_API_KEY` is required for AI-backed converters. `apps/cli/src/ai/client.ts` reads it from the environment or `apps/cli/.env`.
- `FIRECRAWL_API_KEY` is required for web page conversion.
- Video and audio conversion uses the bundled `ffmpeg-static` binary.

## Architecture

- CLI entry point: `apps/cli/src/cli.ts`
- Public API: `apps/cli/src/index.ts`
- Converter commands live in `apps/cli/src/commands/`
- Converter implementations live in `apps/cli/src/converters/`
- Input auto-detection lives in `apps/cli/src/utils/detect.ts`
- Most converters follow `validate -> extract -> AI format -> frontmatter -> output`
- Web conversion skips the AI formatting step and uses Firecrawl markdown directly

## Release

Publish the CLI from the repo root with:

```bash
npm run release
```

That runs the filtered Turbo build and publishes via Changesets from `apps/cli`.

## Links

- npm: [allmd](https://www.npmjs.com/package/allmd)
- GitHub: [mblode/allmd](https://github.com/mblode/allmd)
- Package docs: [`apps/cli/README.md`](apps/cli/README.md)

## License

[MIT](LICENSE.md)
