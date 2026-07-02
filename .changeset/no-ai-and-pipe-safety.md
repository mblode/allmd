---
"allmd": minor
---

Add a global `--no-ai` flag that skips the AI formatting pass and emits the raw extracted text (frontmatter still applied) for text-based converters (youtube, pdf, gdoc, docx, epub, csv, pptx, tweet, rss). It runs faster, works offline, and no longer requires `OPENAI_API_KEY`. Image and video/audio conversion depend on AI (vision OCR and transcription), so `--no-ai` is rejected there with a clear error. The flag is also configurable via cosmiconfig (`ai`).

Fix pipe safety: decorative output (spinner, info, success, and warning messages) now goes to stderr instead of stdout, so `--stdout` and piping the converted markdown keep stdout clean. The progress spinner is disabled automatically when stderr is not a TTY.
