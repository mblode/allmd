# Convert Google Doc to Markdown

Exports a public Google Doc as HTML, preprocesses the HTML to strip base64 images and inline styles, and converts to markdown via a Google Docs-specific Turndown instance.

## Conversion Workflow

```text
- [ ] Step 1: Validate URL and extract document ID
- [ ] Step 2: Fetch HTML export
- [ ] Step 3: Preprocess and convert to markdown
- [ ] Step 4: Apply AI formatting
- [ ] Step 5: Add frontmatter and output
```

### Step 1: Validate URL and extract document ID

Expects a Google Docs URL matching: `docs.google.com/document/d/<docId>`

The document ID is extracted via regex. Any URL variant (edit, preview, published) works as long as it contains the `/d/<docId>` segment.

### Step 2: Fetch HTML export

Constructs the export URL: `https://docs.google.com/document/d/<docId>/export?format=html`

**The document must be publicly shared** ("Anyone with the link"). Private documents return a 404 with a helpful error message.

### Step 3: Preprocess and convert to markdown

1. Parses HTML with linkedom
2. **Preprocesses the DOM** to clean Google's messy export:
   - Removes all `<style>` elements
   - Replaces base64 data URI images with `[image]` text placeholders (external image URLs are preserved)
   - Strips `style` attributes from all elements
   - Unwraps `<span>` elements that have no remaining attributes
3. Extracts title using fallback chain: `<title>` → first `<h1>` → first bold paragraph → "Untitled Google Doc"
4. Extracts `<body>` innerHTML and converts to markdown via a Google Docs-specific Turndown instance (ATX headings, fenced code, GFM tables, data URI image safety net)

Does **not** use Mozilla Readability — Google's export is purely document content with no navigation or chrome to strip.

### Step 4: Apply AI formatting

- AI restructures the content into clean, readable markdown
- Especially valuable here because even after preprocessing, Google Docs markup can produce noisy markdown

### Step 5: Add frontmatter and output

- Title priority: `<title>` element → first `<h1>` → bold first paragraph → "Untitled Google Doc"
- Frontmatter fields: `title`, `source`, `date`, `type` ("gdoc"), `docId`

## CLI Usage

```bash
md gdoc <url>
md gdoc "https://docs.google.com/document/d/abc123/edit" -o doc.md
```

## Best Practices

- The document must be shared publicly before conversion; check sharing settings first
- Base64-embedded images in Google Docs are replaced with `[image]` placeholders since they cannot be meaningfully represented in markdown
- External image URLs (Google-hosted CDN links) are preserved but may expire if sharing settings change

## Edge Cases

- **Private documents**: Return 404; the doc must be shared as "Anyone with the link"
- **Embedded images**: Base64 data URI images are replaced with `[image]` placeholders; external image URLs are preserved as markdown image links
- **Complex formatting**: Text boxes, columns, and drawing elements may not convert cleanly
- **Comments and suggestions**: Not included in the HTML export — only accepted content appears

## Troubleshooting

- **"Google Doc not found"** — verify the document is publicly shared (not just "anyone in your org")
- **"Could not extract document ID"** — the URL must contain `docs.google.com/document/d/<id>`; spreadsheets, slides, and forms are not supported
- **`[image]` markers in output** — base64-embedded images are replaced with placeholders; the original images are not recoverable from the export
