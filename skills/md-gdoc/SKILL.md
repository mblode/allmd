---
name: md-gdoc
description: Converts public Google Docs to markdown. Use when the user wants to convert a Google Doc to markdown, export a shared document as a markdown file, or extract content from a Google Docs URL.
---

# Convert Google Doc to Markdown

Exports a public Google Doc as HTML, extracts the content using Readability, and converts it to markdown via Turndown. Reuses the same HTML-to-markdown pipeline as the web converter.

## Reference Files

| File | Read when |
|------|-----------|
| `references/conversion-options.md` | You need details on shared types, CLI flags, AI formatting, or output options |

## Conversion Workflow

```text
- [ ] Step 1: Validate URL and extract document ID
- [ ] Step 2: Fetch HTML export
- [ ] Step 3: Parse and convert to markdown
- [ ] Step 4: Apply AI formatting (optional)
- [ ] Step 5: Add frontmatter and output
```

### Step 1: Validate URL and extract document ID

Expects a Google Docs URL matching: `docs.google.com/document/d/<docId>`

The document ID is extracted via regex. Any URL variant (edit, preview, published) works as long as it contains the `/d/<docId>` segment.

### Step 2: Fetch HTML export

Constructs the export URL: `https://docs.google.com/document/d/<docId>/export?format=html`

**The document must be publicly shared** ("Anyone with the link"). Private documents return a 404 with a helpful error message.

### Step 3: Parse and convert to markdown

1. Parses HTML with linkedom
2. Extracts title from `<title>` element
3. Runs Mozilla Readability to identify the document body
4. If Readability succeeds: converts the extracted content to markdown via Turndown
5. If Readability fails: falls back to converting the full HTML body

Uses the same `htmlToMarkdown()` function as the web converter (ATX headings, fenced code, GFM tables).

### Step 4: Apply AI formatting (optional)

- Default: ON. Skip with `--no-ai`
- AI formatting is especially valuable here because Google Docs HTML export includes significant inline styling and messy markup
- AI restructures the content into clean, readable markdown

### Step 5: Add frontmatter and output

- Title priority: Readability title → `<title>` element → "Untitled Google Doc"
- Frontmatter fields: `title`, `source`, `date`, `type` ("gdoc"), `docId`

## CLI Usage

```bash
md gdoc <url>
md gdoc "https://docs.google.com/document/d/abc123/edit" -o doc.md
md gdoc <url> --no-ai
md gdoc <url> --no-ai -o raw-doc.md
```

## Best Practices

- AI formatting is strongly recommended for Google Docs — the HTML export is notoriously messy with inline styles
- The document must be shared publicly before conversion; check sharing settings first
- For documents with many images, note that image URLs point to Google-hosted assets that may expire over time

## Edge Cases

- **Private documents**: Return 404; the doc must be shared as "Anyone with the link"
- **Embedded images**: Image URLs are Google-hosted and may expire; they are preserved as markdown image links but may break later
- **Complex formatting**: Text boxes, columns, and drawing elements may not convert cleanly
- **Comments and suggestions**: Not included in the HTML export — only accepted content appears
- **Very long documents**: May be large in memory; AI formatting has an 8192 token output limit

## Troubleshooting

- **"Google Doc not found"** — verify the document is publicly shared (not just "anyone in your org")
- **"Could not extract document ID"** — the URL must contain `docs.google.com/document/d/<id>`; spreadsheets, slides, and forms are not supported
- **Formatting issues** — Google Docs HTML is verbose; use AI formatting for best results
- **Missing images** — images appear as markdown links to Google servers; if the doc sharing changes, links may break
