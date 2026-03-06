# allmd

## 1.1.1

### Patch Changes

- e12d710: Use Firecrawl markdown directly for web conversions, require only `FIRECRAWL_API_KEY` for web, and make long-running CLI conversions interruptible.

## 1.1.0

### Minor Changes

- Fix web converter hanging on JS-rendered pages

  - Add 30-second fetch timeout to all HTTP requests using AbortController — prevents indefinite hangs on unresponsive servers
  - Add Firecrawl fallback for JavaScript-rendered pages (set FIRECRAWL_API_KEY in environment to enable)
  - Add SIGINT handler so Ctrl+C exits cleanly
  - Add step-by-step verbose logging in the web converter for better progress visibility
  - Apply timeout fix to youtube, gdoc, and tweet converters

## 1.0.5

### Patch Changes

- 9b9b7ff: Updated README documentation with simplified header design and revised tagline to "Turn the whole universe into markdown."
- 8071264: fix audio compression

## 1.0.4

### Patch Changes

- 03120da: Added video transcription support with speaker diarization using OpenAI's gpt-4o-transcribe-diarize model, allowing users to transcribe video files with automatic speaker identification and optional custom speaker names and reference audio samples.

## 1.0.3

### Patch Changes

- 5a22b01: Add CSV, DOCX, EPUB, PPTX, RSS, and Tweet converters. Add auto-detection, clipboard support, batch processing, config file support, shell completion, update notifier, and examples command.

## 1.0.2

### Patch Changes

- 5ed066b: Add banner, badges, and feature list to README
- a033d39: Simplify README

## 1.0.1

### Patch Changes

- de29ce1: initial commit
