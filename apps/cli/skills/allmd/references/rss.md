# Convert RSS/Atom Feed to Markdown

Fetches an RSS or Atom feed URL, parses it with rss-parser, and converts all items to markdown sections.

## Conversion Workflow

1. **Validate** URL (auto-detected for URLs containing `/feed`, `/rss`, `.xml`, `.atom`)
2. **Fetch and parse** feed using `rss-parser` library
3. **Build markdown** — feed description as blockquote, each item as a `## Heading` section
4. **AI format** — restructures into clean markdown via GPT-5-mini
5. **Add frontmatter** and output

## Key Details

- Uses `rss-parser` library for RSS 2.0 and Atom feed parsing
- Each feed item includes: title, metadata (author, date, link), content, and categories/tags
- Item content rendered as markdown via `htmlToMarkdown()` (same Turndown engine as web converter)
- Falls back to `contentSnippet` or `summary` if full `content` is unavailable
- Markdown links in feed URLs are escaped to prevent injection (`]` → `%5D`, `)` → `%29`)
- Items separated by `---` horizontal rules

## Frontmatter Fields

```yaml
type: rss
title: "Feed Title"
source: "https://blog.example.com/feed"
items: 25
feedUrl: "https://blog.example.com/feed.xml"
```

## CLI Usage

```bash
allmd rss https://blog.example.com/feed
allmd rss https://blog.example.com/feed.xml -o feed.md
```

## Edge Cases

- **Private feeds**: Feeds requiring authentication will fail
- **Large feeds**: Feeds with hundreds of items may produce very long output
- **Malformed feeds**: `rss-parser` handles most variations but truly broken XML will fail
- **HTML in content**: Converted to markdown; complex layouts may lose formatting
