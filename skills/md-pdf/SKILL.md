---
name: md-pdf
description: Converts PDF documents to markdown. Use when the user wants to extract text from a PDF, convert a PDF report to markdown, process a research paper, or handle scanned documents.
---

# Convert PDF to Markdown

Extracts text from a PDF file using pdf-parse, detects scanned documents, and optionally formats the content with AI.

## Reference Files

| File | Read when |
|------|-----------|
| `references/conversion-options.md` | You need details on shared types, CLI flags, AI formatting, or output options |

## Conversion Workflow

```text
- [ ] Step 1: Validate file
- [ ] Step 2: Extract text with pdf-parse
- [ ] Step 3: Detect scanned PDFs
- [ ] Step 4: Apply AI formatting (optional)
- [ ] Step 5: Add frontmatter and output
```

### Step 1: Validate file

The file must exist and be readable. The command validates file access before attempting to parse.

### Step 2: Extract text with pdf-parse

- Reads the PDF as a binary buffer
- Uses `pdf-parse` to extract plain text and metadata
- Available metadata: page count, PDF info dict (Title, Author, Creator, Producer, PDF version)

### Step 3: Detect scanned PDFs

If the extracted text is fewer than 100 characters, the PDF is likely scanned or image-based. A warning blockquote is prepended:

> This PDF appears to be scanned/image-based. Text extraction may be incomplete.

For scanned PDFs, consider using `md image` on individual page screenshots instead.

### Step 4: Apply AI formatting (optional)

- Default: ON for text-based PDFs. Skip with `--no-ai`
- AI receives the raw extracted text and restructures it into clean markdown
- Without AI: outputs `# filename` followed by the raw extracted text

### Step 5: Add frontmatter and output

- Title: from PDF metadata `info.Title` if available, otherwise the filename
- Frontmatter fields: `title`, `source`, `date`, `type` ("pdf"), `pages`

## CLI Usage

```bash
md pdf <file>
md pdf report.pdf -o report.md
md pdf paper.pdf --no-ai
md pdf document.pdf --no-ai -o raw.md
```

## Best Practices

- AI formatting is most valuable for PDFs with complex layouts — it restructures columns, headers, and footers into linear markdown
- The `--no-ai` mode is useful for quick extraction when you just need the raw text
- Check the page count in frontmatter to verify the full document was processed

## Edge Cases

- **Scanned/image-based PDFs**: Detected via the 100-character threshold; text extraction will be poor or empty
- **Password-protected PDFs**: pdf-parse will fail; the file must be unprotected
- **Complex table layouts**: Text extraction follows PDF text ordering, which may not match visual reading order for multi-column layouts
- **Very large PDFs**: Entire file is loaded into memory; very large files may cause memory pressure
- **Non-Latin text**: Extraction depends on the PDF's embedded font encoding

## Troubleshooting

- **Empty or garbage output** — the PDF is likely scanned; use `md image` on page screenshots instead
- **"File not found"** — verify the file path exists
- **Jumbled text ordering** — PDFs with multi-column layouts may extract text in unexpected order; AI formatting can help reorder
- **Missing title** — the PDF metadata may not include a Title field; the filename is used as fallback
