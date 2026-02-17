# Convert EPUB to Markdown

Reads an `.epub` file, extracts chapter HTML content via epub2, converts each chapter to markdown, and joins them with horizontal rules.

## Conversion Workflow

1. **Validate** file exists and has `.epub` extension
2. **Parse** EPUB structure using `epub2` library
3. **Extract** each chapter's HTML and convert to markdown via Turndown
4. **Join** chapters with `---` separators, adding chapter headings where available
5. **AI format** — restructures into clean markdown via GPT-5-mini
6. **Add frontmatter** and output

## Key Details

- Uses `epub2` library (`EPub.createAsync()`) for EPUB parsing
- Reuses `htmlToMarkdown()` from the web converter for HTML → markdown
- Title and author extracted from EPUB metadata
- Chapters with empty content are skipped
- Corrupt EPUB files are caught with a descriptive error message

## Frontmatter Fields

```yaml
type: epub
title: "Book Title"
source: "/path/to/book.epub"
author: "Author Name"
chapters: 12
```

## CLI Usage

```bash
allmd epub book.epub
allmd epub book.epub -o book.md
allmd epub "books/*.epub" -d output/
```

## Edge Cases

- **DRM-protected EPUBs**: Will fail to parse
- **Image-heavy EPUBs**: Only text content is extracted
- **Corrupt files**: Caught with `Failed to parse EPUB file` error
