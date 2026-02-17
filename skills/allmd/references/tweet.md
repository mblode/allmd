# Convert Tweet to Markdown

Fetches a tweet/X post via the Twitter oEmbed API and converts it to markdown.

## Conversion Workflow

1. **Validate** URL is from `twitter.com` or `x.com`
2. **Normalize** URL to `twitter.com` format for oEmbed API
3. **Fetch** tweet content via Twitter oEmbed API (`publish.twitter.com/oembed`)
4. **Fallback** to web extraction via Readability if oEmbed fails
5. **AI format** — restructures into clean markdown via GPT-5-mini
6. **Add frontmatter** and output

## Key Details

- Primary method: Twitter oEmbed API (no authentication required)
- Fallback: Web extraction using the same Readability engine as the web converter
- Author name and URL extracted from oEmbed response
- HTML entities in tweet text properly decoded
- `pic.twitter.com` links stripped from text

## Frontmatter Fields

```yaml
type: tweet
title: "Tweet by Author Name"
source: "https://x.com/user/status/123456"
author: "Author Name"
```

## CLI Usage

```bash
allmd tweet https://x.com/user/status/123456
allmd tweet https://twitter.com/user/status/123456 -o tweet.md
```

## Edge Cases

- **Private/deleted tweets**: Both oEmbed and web extraction will fail
- **Threads**: Only the linked tweet is extracted, not the full thread
- **Media-only tweets**: Text may be empty or minimal
- **Rate limiting**: oEmbed API may rate-limit with many requests
