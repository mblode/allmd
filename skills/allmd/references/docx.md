# Convert Word Document to Markdown

Reads a `.docx` or `.doc` file, converts HTML content via mammoth, then converts to markdown using Turndown with GFM support.

## Conversion Workflow

1. **Validate** file exists and has `.docx` or `.doc` extension
2. **Extract** HTML content using mammoth
3. **Convert** HTML to markdown via Turndown (same engine as web converter)
4. **AI format** — restructures into clean markdown via GPT-5-mini
5. **Add frontmatter** and output

## Key Details

- Uses `mammoth` library for DOCX → HTML conversion
- Reuses `htmlToMarkdown()` from the web converter for HTML → markdown
- Title derived from filename via `titleFromFilename()`
- Mammoth warnings (e.g., unsupported styles) logged in verbose mode

## Frontmatter Fields

```yaml
type: docx
title: "Document Title"
source: "/path/to/document.docx"
```

## CLI Usage

```bash
allmd docx document.docx
allmd docx document.docx -o output.md
allmd docx "docs/*.docx" -d output/
```

## Edge Cases

- **`.doc` files**: mammoth has limited support for legacy `.doc` format; results may vary
- **Complex formatting**: Tables, images, and advanced layouts may not convert perfectly
- **Embedded images**: Not extracted; only text content is converted
