---
name: md-web
description: Converts web pages to clean markdown using Mozilla Readability and Turndown. Use when the user wants to save a website as markdown, extract article content from a URL, convert HTML to markdown, or scrape readable content from a web page.
---

# Convert Web Page to Markdown

Fetches a URL, extracts the main article content using Mozilla Readability, and converts it to markdown via Turndown with GitHub Flavored Markdown support.

## Reference Files

| File | Read when |
|------|-----------|
| `references/conversion-options.md` | You need details on shared types, CLI flags, AI formatting, or output options |

## Conversion Workflow

```text
- [ ] Step 1: Validate URL
- [ ] Step 2: Extract readable content
- [ ] Step 3: Convert HTML to markdown
- [ ] Step 4: Apply AI formatting (optional)
- [ ] Step 5: Add frontmatter and output
```

### Step 1: Validate URL

- Must be a valid HTTP or HTTPS URL
- The page must be publicly accessible (no authentication)
- Uses `fetch()` directly — does NOT execute JavaScript, so JS-rendered content will be missing

### Step 2: Extract readable content

- Parses HTML with linkedom (lightweight DOM parser)
- Runs Mozilla Readability to identify the main article body
- Strips navigation, sidebars, ads, footers
- Extracts: `title`, `content` (HTML), `excerpt`, `siteName`
- If Readability returns null, the conversion fails

### Step 3: Convert HTML to markdown

Turndown configuration:
- ATX headings (`# heading` style)
- Fenced code blocks (triple backtick)
- Dash bullet list markers (`-`)
- GFM plugin enabled (tables, strikethrough, task lists)

### Step 4: Apply AI formatting (optional)

- Default: ON. Skip with `--no-ai`
- AI receives raw markdown plus context (title, source URL, type="web article")
- Restructures into clean, well-organized markdown
- Preserves all factual content; adds nothing

### Step 5: Add frontmatter and output

Frontmatter fields: `title`, `source`, `date`, `type` ("web"), `excerpt`, `siteName`

## CLI Usage

```bash
md web <url>
md web <url> -o article.md
md web <url> --no-ai
md web <url> --no-ai -o raw-article.md
```

## Best Practices

- Headings hierarchy preserved (h1–h6 mapping)
- Code blocks retain language annotation where possible
- Tables converted to GFM pipe tables
- Images preserved as markdown image links
- Links preserved with original hrefs
- Lists maintain nesting structure

## Edge Cases

- **Paywalled content**: Readability extracts only the visible portion; conversion may be partial
- **Single-page applications**: `fetch()` gets the initial HTML only; React/Vue-rendered content will be blank
- **Non-article pages**: Readability works best on article-style content; landing pages or dashboards may fail
- **Large pages**: Very long articles may exceed the 8192 max output tokens for AI formatting
- **Relative URLs**: Links in the output may be broken if the source uses relative hrefs

## Troubleshooting

- **"Could not extract readable content"** — the page has no recognizable article body; try a different URL or use `--no-ai` with manual cleanup
- **"Failed to fetch ... 403"** — the server blocks automated requests; some sites require specific User-Agent headers
- **Empty or very short output** — the page may be JS-rendered; check view-source to confirm content is in the initial HTML
