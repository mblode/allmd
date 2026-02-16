# Convert YouTube Video to Markdown

Extracts captions from a YouTube video, fetches video metadata via oEmbed, and formats the transcript as clean markdown.

## Conversion Workflow

```text
- [ ] Step 1: Validate YouTube URL
- [ ] Step 2: Extract video ID
- [ ] Step 3: Fetch metadata and captions
- [ ] Step 4: Format transcript
- [ ] Step 5: Add frontmatter and output
```

### Step 1: Validate YouTube URL

Supported URL formats:
- `https://www.youtube.com/watch?v=VIDEO_ID` (standard)
- `https://youtu.be/VIDEO_ID` (short)
- `https://www.youtube.com/embed/VIDEO_ID` (embed)
- `https://www.youtube.com/shorts/VIDEO_ID` (shorts)

### Step 2: Extract video ID

Regex extraction of the 11-character video ID from any of the 4 URL patterns above.

### Step 3: Fetch metadata and captions

- Fetches video title and author via YouTube oEmbed API (no auth needed)
- Fetches transcript segments via `youtube-transcript` package (English captions, `lang: 'en'`)
- Both requests run in parallel via `Promise.all`
- HTML entities in caption text are decoded (`&amp;` → `&`, etc.)
- If no captions exist, throws "No captions available"

### Step 4: Format transcript

**With AI** (`--no-ai` not set): Raw transcript text sent to AI for structured prose formatting.

**Without AI** (`--no-ai`): Timestamped format:
```
# Video Title

[0:00] First segment text
[0:15] Second segment text
[1:02] Third segment text
```

### Step 5: Add frontmatter and output

Frontmatter fields: `title`, `source`, `date`, `type` ("youtube"), `videoId`, `author`

## CLI Usage

```bash
allmd youtube <url>
allmd yt <url>                    # alias
allmd youtube <url> -o transcript.md
allmd youtube <url> --no-ai       # timestamped raw output
```

## Best Practices

- AI formatting works best for talks and lectures — it adds paragraph breaks at topic changes
- Raw timestamped format is better when you need to reference specific moments
- The oEmbed metadata provides the video title and channel name without any API key

## Edge Cases

- **No captions available**: Video may be too new, have captions disabled, or be region-locked
- **Auto-generated captions**: No punctuation, potential word errors — AI formatting helps significantly
- **Non-English videos**: Defaults to `lang: 'en'`; non-English captions may not be fetched
- **Live stream transcripts**: May have gaps or lower quality auto-captions
- **Music videos**: Lyrics may be available as captions, but instrumental sections have no text

## Troubleshooting

- **"No captions available"** — check if the video has captions enabled; very new uploads may not have them yet
- **"Could not extract video ID"** — verify the URL matches one of the 4 supported patterns
- **Garbled or incorrect text** — auto-generated captions have known accuracy issues; AI formatting can help clean them up
