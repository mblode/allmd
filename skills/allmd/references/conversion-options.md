# Conversion Options and Output Format

## TypeScript Types

```typescript
interface ConversionOptions {
  output?: string;      // Output file path (undefined = stdout)
  verbose?: boolean;    // Enable verbose logging
  frontmatter?: boolean; // Add YAML frontmatter (default: true)
}

interface ConversionResult {
  title: string;
  markdown: string;       // Final markdown with YAML frontmatter
  rawContent?: string;    // Raw content before AI formatting
  metadata: Record<string, unknown>;
}
```

## CLI Global Flags

All `allmd` commands accept:

| Flag | Effect |
|------|--------|
| `-o, --output <file>` | Write markdown to file instead of stdout |
| `-v, --verbose` | Enable verbose output |
| `-c, --clipboard` | Read input from clipboard |
| `--copy` | Copy output to clipboard |
| `-d, --output-dir <dir>` | Output directory for converted files |
| `--parallel <n>` | Number of parallel conversions for batch mode (default: 3) |
| `--no-frontmatter` | Skip YAML frontmatter in output |

## Auto-Detection

`allmd <input>` automatically detects the input type:

- **URLs**: Classified as YouTube, Google Doc, tweet, RSS feed, or generic web page
- **Files**: Classified by extension (pdf, image, video, audio, docx, epub, csv, pptx)
- **Unknown**: Falls back to interactive mode

## YAML Frontmatter

Every output includes frontmatter by default (via gray-matter). Disable with `--no-frontmatter`.

```yaml
---
title: "Document title"
source: "URL or file path"
date: "2026-02-16T10:00:00.000Z"
type: web | youtube | video | image | gdoc | pdf | docx | epub | csv | pptx | tweet | rss
# ...plus type-specific fields
---
```

## AI Formatting

AI formatting is always enabled. Raw extracted text is sent to OpenAI GPT-5-mini. The model:

- Restructures text into clean markdown with headings, lists, and code blocks
- Preserves all factual content without adding information
- Uses ATX-style headings, fenced code blocks, dash bullet markers

## Configuration

Supports `.allmdrc`, `.allmdrc.json`, `.allmdrc.yaml`, `allmd.config.js`, or `allmd` key in `package.json` via cosmiconfig.

```json
{
  "output": "docs/",
  "verbose": true,
  "frontmatter": true,
  "openai": {
    "model": "gpt-5-mini"
  }
}
```

## Batch Processing

File commands support glob patterns for batch conversion:

```bash
allmd pdf "docs/*.pdf" -d output/
allmd image "screenshots/**/*.png" -d output/ --parallel 5
```

## Clipboard and Stdin

```bash
# Read URL from clipboard
allmd web -c

# Copy output to clipboard
allmd web https://example.com --copy

# Pipe input via stdin
echo "https://example.com" | allmd web -
```

## Environment Variables

| Variable | Required | Default |
|----------|----------|---------|
| `OPENAI_API_KEY` | Yes | — |

## Output Handling

- **With `-o output.md`**: Writes to the specified file, creates parent directories if needed
- **With `-d output/`**: Auto-generates filenames from document titles in the specified directory
- **With `--copy`**: Copies markdown to system clipboard
- **Without flags**: Writes markdown to stdout (pipeable to other commands)
