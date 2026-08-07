<div align="center">

# [allmd](https://blode.co/allmd)

**Turn anything into context your agent can read**

Point it at a URL or a file. Twelve source types, markdown out.

<p align="center">
  <a href="https://www.npmjs.com/package/allmd">
    <img src="https://img.shields.io/npm/v/allmd?style=flat&colorA=000000&colorB=000000" />
  </a>
  <a href="https://github.com/mblode/allmd/blob/main/LICENSE.md">
    <img src="https://img.shields.io/github/license/mblode/allmd?style=flat&colorA=000000&colorB=000000" />
  </a>
</p>

</div>

## Demo

See what each converter produces, or read the full reference in the docs.

<p>
<a href="https://blode.co/allmd">
<img alt="Try it" src=".github/assets/demo.svg" width="200" />
</a>
<a href="https://blode.co/allmd/docs">
<img alt="Read the docs" src=".github/assets/documentation.svg" width="200" />
</a>
</p>

## Install

```bash
npm install -g allmd
```

Requires Node 24 or newer. Set `OPENAI_API_KEY` for the AI-backed converters and
`FIRECRAWL_API_KEY` for web pages, in your environment or a `.env` file. Video and audio
transcription uses the bundled `ffmpeg-static` binary, so there is nothing else to install.

## Quickstart

```bash
# Auto-detect the input type from a URL or a file path
allmd https://blode.co/marx

# A YouTube transcript, with timestamps, written to a file you name
allmd youtube https://www.youtube.com/watch?v=dQw4w9WgXcQ -o transcript.md

# A PDF, raw extracted text with no AI pass, printed instead of saved
allmd pdf report.pdf --no-ai --stdout
```

Output is markdown with YAML frontmatter, written into the current directory unless `-o` or `-d`
says otherwise. Run `allmd` with no arguments for interactive mode, or `allmd examples` for more.

## Agents

```bash
npx skills add mblode/allmd
```

Adds allmd as a skill in Claude Code, Cursor, and Codex. The agent converts instead of scraping.

## Converters

| Command | Input |
|---|---|
| `web` | Any URL, fetched and cleaned through Firecrawl. |
| `youtube` | A video transcript with timestamps. |
| `video` | An audio or video file, transcribed with optional speaker diarization. |
| `image` | A screenshot or photo, described with GPT vision. |
| `gdoc` | A published Google Doc. |
| `pdf`, `docx`, `epub`, `pptx` | Local documents. |
| `csv` | Tabular data, as a markdown table. |
| `tweet`, `rss` | An X post, or the entries in a feed. |

Pass a URL or file with no command and allmd picks the converter for you.

## Options

| Flag | Description |
|---|---|
| `-o, --output <file>` | Write to a specific file. |
| `-d, --output-dir <dir>` | Write into a directory. |
| `--stdout` | Print the markdown instead of writing a file. |
| `-c, --clipboard` / `--copy` | Read the input from the clipboard, or copy the output to it. |
| `--no-ai` | Skip the AI formatting pass and emit the raw extracted text. |
| `--no-frontmatter` | Leave the YAML frontmatter off. |
| `--parallel <n>` | Conversions to run at once, 3 by default. |
| `--speakers <names>` | Comma-separated speaker names for a diarized transcript. |

Text-based converters run an AI formatting pass by default. `--no-ai` turns it off, which is
faster, works offline, and needs no `OPENAI_API_KEY`. Web pages already skip it, and `image` and
`video` cannot, since vision and transcription are the conversion.

## Notes

- **Programmatic API:** `import { convertWeb } from "allmd"` returns the markdown along with the
  title and extracted metadata. Every converter has a matching `convert*` export.
- **Config file:** defaults for `ai`, `frontmatter`, `outputDir`, `parallel`, and the OpenAI model
  can live in an `.allmdrc`, an `allmd.config.js`, or an `allmd` key in `package.json`.
- **Shell completion:** `allmd completion install` sets up completions for bash, zsh, or fish.

## License

MIT

---

Crafted by [<img src="https://blode.co/avatar-circle.png" width="20" align="top" />](https://blode.co) [Matthew Blode](https://blode.co)
