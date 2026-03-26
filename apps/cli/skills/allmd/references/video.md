# Convert Video/Audio to Markdown

Extracts audio from video files using ffmpeg, transcribes it with OpenAI Whisper via the Vercel AI Gateway, and formats the transcript as markdown.

## Conversion Workflow

```text
- [ ] Step 1: Validate file and format
- [ ] Step 2: Extract audio (video files only)
- [ ] Step 3: Transcribe with Whisper
- [ ] Step 4: Format transcript
- [ ] Step 5: Add frontmatter and output
- [ ] Step 6: Cleanup temp files
```

### Step 1: Validate file and format

**Video formats**: `.mp4`, `.mkv`, `.avi`, `.mov`, `.webm`, `.flv`, `.wmv`, `.m4v`
**Audio formats**: `.mp3`, `.wav`, `.m4a`, `.ogg`, `.flac`, `.aac`, `.wma`

Audio files skip the extraction step and go directly to transcription.

### Step 2: Extract audio (video files only)

- Creates a temporary directory in the system temp folder
- Uses `ffmpeg-extract-audio` (with bundled `ffmpeg-static`) to extract audio as MP3
- Audio files bypass this step entirely

### Step 3: Transcribe with Whisper

- Reads the audio file into a buffer
- Sends to OpenAI Whisper (`whisper-1` model) via Vercel AI Gateway
- Returns: full text + timestamped segments (start time and text for each segment)

### Step 4: Format transcript

Raw transcript text is sent to AI for structured prose formatting with paragraph breaks and structure.

### Step 5: Add frontmatter and output

Frontmatter fields: `title` (filename), `source` (file path), `date`, `type` ("video")

### Step 6: Cleanup temp files

Temporary audio files are always deleted, even if transcription fails (uses `finally` block).

## CLI Usage

```bash
allmd video <file>
allmd video recording.mp4 -o transcript.md
allmd video podcast.mp3 -o podcast.md
allmd video interview.wav -o transcript.md
```

## Best Practices

- Audio files (mp3, wav, etc.) are fully supported — not just video
- AI formatting works best for talks and interviews — it adds paragraph breaks and structure
- For best transcription quality, use source files with clear audio and minimal background noise

## Edge Cases

- **Very long recordings**: Whisper has file size limits; large files may need to be split
- **Multiple speakers**: No speaker diarization — all speech is merged into a single stream
- **Background music or noise**: Degrades transcription accuracy significantly
- **Non-English audio**: Whisper auto-detects language but defaults may vary
- **Corrupted media files**: ffmpeg extraction may fail; check the source file plays correctly
- **Files with no audio track**: Some video files (e.g., screen recordings) may have no audio

## Troubleshooting

- **"Unsupported format"** — check the file extension is in the supported list above
- **ffmpeg errors** — ensure ffmpeg is available; the `ffmpeg-static` npm package bundles it, but system-level issues can interfere
- **Empty transcription** — the audio may be silent, corrupted, or contain only music
- **Garbled output** — audio quality is too low; try a higher bitrate source
