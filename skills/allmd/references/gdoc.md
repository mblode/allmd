# Convert Google Doc to Markdown

Exports a public Google Doc directly as markdown using Google's native `format=markdown` export. No HTML parsing or conversion needed.

## Conversion Workflow

```text
- [ ] Step 1: Validate URL and extract document ID
- [ ] Step 2: Fetch markdown export
- [ ] Step 3: Extract title and apply AI formatting
- [ ] Step 4: Add frontmatter and output
```

### Step 1: Validate URL and extract document ID

Expects a Google Docs URL matching: `docs.google.com/document/d/<docId>`

The document ID is extracted via regex. Any URL variant (edit, preview, published) works as long as it contains the `/d/<docId>` segment.

### Step 2: Fetch markdown export

Constructs the export URL: `https://docs.google.com/document/d/<docId>/export?format=markdown`

**The document must be publicly shared** ("Anyone with the link"). Private documents return a 404 with a helpful error message.

Google handles the document-to-markdown conversion natively, including headings, lists, tables, links, and formatting.

### Step 3: Extract title and apply AI formatting

1. Extracts title from the first `# ` heading in the markdown, with fallback to "Untitled Google Doc"
2. AI restructures the content into clean, well-formatted markdown

### Step 4: Add frontmatter and output

- Frontmatter fields: `title`, `source`, `date`, `type` ("gdoc"), `docId`

## CLI Usage

```bash
allmd gdoc <url>
allmd gdoc "https://docs.google.com/document/d/abc123/edit" -o doc.md
```

## Best Practices

- The document must be shared publicly before conversion; check sharing settings first
- Images in Google Docs are exported as external URLs by the markdown exporter

## Edge Cases

- **Private documents**: Return 404; the doc must be shared as "Anyone with the link"
- **Complex formatting**: Text boxes, columns, and drawing elements may not convert cleanly to markdown
- **Comments and suggestions**: Not included in the export — only accepted content appears

## Troubleshooting

- **"Google Doc not found"** — verify the document is publicly shared (not just "anyone in your org")
- **"Could not extract document ID"** — the URL must contain `docs.google.com/document/d/<id>`; spreadsheets, slides, and forms are not supported
