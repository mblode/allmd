# Convert Web Page to Markdown

Fetches a URL, renders and extracts the main page content with Firecrawl, then uses Firecrawl's markdown directly as the final allmd output with optional frontmatter.

## Conversion Workflow

```text
- [ ] Step 1: Validate URL
- [ ] Step 2: Extract markdown with Firecrawl
- [ ] Step 3: Use Firecrawl markdown directly
- [ ] Step 4: Add frontmatter and output
```

### Step 1: Validate URL

- Must be a valid HTTP or HTTPS URL
- The page must be publicly accessible (no authentication)
- Uses Firecrawl, which can render JavaScript before extracting content

### Step 2: Extract readable content

- Requires `FIRECRAWL_API_KEY`
- Uses Firecrawl's markdown extraction with `onlyMainContent: true`
- Supports JavaScript-rendered pages and harder sites better than a local HTML parser
- Extracts: `title`, `content` (markdown), `excerpt`, `siteName`
- Uses an explicit timeout for the Firecrawl scrape request

### Step 3: Convert HTML to markdown

Firecrawl returns markdown directly, so the web converter no longer runs a separate HTML-to-markdown pass.

### Step 4: Add frontmatter and output

Frontmatter fields: `title`, `source`, `date`, `type` ("web"), `excerpt`, `siteName`

## CLI Usage

```bash
allmd web <url>
allmd web <url> -o article.md
allmd web <url> --no-frontmatter
```

## Best Practices

- Set `FIRECRAWL_API_KEY` before using `allmd web`
- Use `-v` when debugging extraction latency or page-specific failures
- Use `-o article.md` when converting long pages so output is saved to disk instead of dumped to stdout
- Use `Ctrl+C` to interrupt a slow Firecrawl run

## Edge Cases

- **Paywalled content**: Firecrawl can only extract what the service can access; paywalled output may still be partial
- **Very dynamic pages**: Some sites may still require longer render time or site-specific handling
- **Large pages**: Output can still be large even without an AI post-processing pass
- **Hosted dependency**: Web conversion now depends on Firecrawl availability and your API quota

## Troubleshooting

- **"Web conversion requires FIRECRAWL_API_KEY"** — set `FIRECRAWL_API_KEY` in your environment or `.env`
- **"Firecrawl timed out"** — the page may need more render time or Firecrawl may be under load
- **Need to stop a long-running conversion** — press `Ctrl+C` to cancel the active Firecrawl request
- **Empty or very short output** — inspect the raw page in Firecrawl directly and retry with `-v`
