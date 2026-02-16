# Conversion Options and Output Format

## TypeScript Types

```typescript
interface ConversionOptions {
  ai: boolean;     // Use AI formatting (default: true)
  output?: string; // Output file path (undefined = stdout)
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
| `--no-ai` | Skip AI formatting, raw conversion only |

## YAML Frontmatter

Every output includes frontmatter (via gray-matter):

```yaml
---
title: "Document title"
source: "URL or file path"
date: "2026-02-16T10:00:00.000Z"
type: web | youtube | video | image | gdoc | pdf
# ...plus type-specific fields
---
```

## AI Formatting

When AI is enabled (the default), raw extracted text is sent to OpenAI GPT-4o. The model:

- Restructures text into clean markdown with headings, lists, and code blocks
- Preserves all factual content without adding information
- Uses ATX-style headings, fenced code blocks, dash bullet markers

## Environment Variables

| Variable | Required | Default |
|----------|----------|---------|
| `OPENAI_API_KEY` | Yes (for AI features) | — |

## Output Handling

- **With `-o output.md`**: Writes to the specified file, creates parent directories if needed
- **Without `-o`**: Writes markdown to stdout (pipeable to other commands)
- **Auto-generated path**: When using interactive mode, a default `./<date>-<slug>.md` path is suggested in the current working directory
