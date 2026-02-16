# md-tools

CLI tool that converts web pages, Google Docs, PDFs, images, video/audio, and YouTube videos into markdown.

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

Requires `OPENAI_API_KEY` in `.env` or environment — used by `src/ai/client.ts` for GPT-5-mini formatting, image description, and Whisper transcription. Video/audio conversion requires `ffmpeg` on PATH (bundled via `ffmpeg-static`).

## Architecture

```
src/
  cli.ts              # Commander entry point, registers all subcommands
  interactive.ts      # Interactive mode (no subcommand)
  types.ts            # ConversionResult, ConversionOptions
  commands/           # One file per subcommand (web, youtube, pdf, image, video, gdoc)
  converters/         # One file per converter, matching commands/ 1:1
  ai/client.ts        # OpenAI client: formatAsMarkdown, describeImage, transcribeAudio
  utils/              # output, frontmatter, slug, path, ui helpers
  vendor.d.ts         # Type declarations for untyped deps (pdf-parse, ffmpeg-extract-audio, turndown-plugin-gfm)
skills/md/            # Claude Code skill definition (SKILL.md + references/)
```

Every converter follows: validate → extract → AI format → add frontmatter → output.

## Adding a New Converter

1. Create `src/converters/<name>.ts` exporting `convert<Name>(input, options): Promise<ConversionResult>`
2. Create `src/commands/<name>.ts` exporting `register<Name>Command(program)` — wire converter + spinner + writeOutput
3. Register in `src/cli.ts`
4. Add skill reference in `skills/md/references/<name>.md` and update `skills/md/SKILL.md` dispatch table

## Gotchas

- **`vendor.d.ts`**: `pdf-parse`, `ffmpeg-extract-audio`, and `turndown-plugin-gfm` have no published types. Hand-written declarations live in `src/vendor.d.ts`. Update these if you upgrade those packages.
- **AI is always on**: All converters always use AI formatting. There is no `--no-ai` flag. Tests that exercise converters will make API calls unless mocked.
- **Skill structure changed**: The old per-converter skill directories (`skills/md-web/`, `skills/md-pdf/`, etc.) were consolidated into a single `skills/md/` directory. Don't recreate the old structure.
