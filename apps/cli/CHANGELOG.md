# allmd

## 2.0.0

### Major Changes

- 2e89a94: Require Node.js 22.12+ (Node 20 reached end-of-life in April 2026). Upgrades runtime dependencies to commander 15, @clack/prompts 1, ai 7, @ai-sdk/openai 4, and pdf-parse 2.

### Minor Changes

- bbaa3eb: Add a global `--no-ai` flag that skips the AI formatting pass and emits the raw extracted text (frontmatter still applied) for text-based converters (youtube, pdf, gdoc, docx, epub, csv, pptx, tweet, rss). It runs faster, works offline, and no longer requires `OPENAI_API_KEY`. Image and video/audio conversion depend on AI (vision OCR and transcription), so `--no-ai` is rejected there with a clear error. The flag is also configurable via cosmiconfig (`ai`).

  Fix pipe safety: decorative output (spinner, info, success, and warning messages) now goes to stderr instead of stdout, so `--stdout` and piping the converted markdown keep stdout clean. The progress spinner is disabled automatically when stderr is not a TTY.

## 1.1.5

### Patch Changes

- 8cfb866: Add clipboard and stdin input support, improve CSV multi-line and quoted-field parsing, harden YouTube transcript fetching, and tighten error handling and config merging across the CLI.

## 1.1.4

### Patch Changes

- Fix CI typecheck script and sync version with npm after monorepo migration
