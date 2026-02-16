---
name: md-image
description: Converts images to markdown using AI vision analysis. Use when the user wants to extract text from an image, describe a photograph or diagram, transcribe a screenshot, or OCR a document image to markdown.
---

# Convert Image to Markdown

Reads an image file and sends it to Claude Vision for analysis. Produces a markdown description that transcribes visible text or describes visual content.

## Reference Files

| File | Read when |
|------|-----------|
| `references/conversion-options.md` | You need details on shared types, CLI flags, AI formatting, or output options |

## Conversion Workflow

```text
- [ ] Step 1: Validate file and format
- [ ] Step 2: Read image to buffer
- [ ] Step 3: AI vision analysis
- [ ] Step 4: Add frontmatter and output
```

### Step 1: Validate file and format

Supported extensions: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

The file must exist and have a supported extension. Unsupported formats throw an error listing valid options.

### Step 2: Read image to buffer

The image file is read as a binary buffer and base64-encoded for the Claude Vision API.

### Step 3: AI vision analysis

The base64 image is sent to Claude Vision with a prompt that handles multiple image types:

- **Text documents / screenshots**: Transcribes all visible text
- **Photographs**: Provides a detailed scene description
- **Diagrams / illustrations**: Describes structure and relationships
- **Charts / graphs**: Extracts data and labels

The output is structured as clean markdown with appropriate headings.

**The `--no-ai` flag has no effect on this command** — vision AI is the only extraction method. The CLI warns the user if `--no-ai` is passed and proceeds with AI anyway.

### Step 4: Add frontmatter and output

Frontmatter fields: `title` (filename), `source` (file path), `date`, `type` ("image"), `mimeType`, `fileSize` (bytes)

## CLI Usage

```bash
md image <file>
md image screenshot.png -o notes.md
md image diagram.jpg
md image photo.webp -o description.md
```

## Best Practices

- Higher resolution images produce better OCR and descriptions
- For multi-page documents, use the `md pdf` command instead — image only processes a single file
- Screenshots with clear text and minimal noise transcribe most accurately
- For complex diagrams, the AI will describe the structure rather than recreate it in markdown

## Edge Cases

- **Low-resolution text**: OCR quality degrades with smaller or blurry text
- **Handwritten text**: Results vary depending on legibility
- **Very large images**: Buffer size can become significant; no explicit size limit but API has token constraints
- **Multi-page documents**: Only single images are processed; use PDF converter for multi-page
- **Complex layouts**: Multi-column text or overlapping elements may not transcribe in correct reading order

## Troubleshooting

- **"Unsupported image format"** — check the extension is one of: jpg, jpeg, png, gif, webp
- **"File not found"** — verify the file path; quotes may be needed for paths with spaces
- **Poor transcription quality** — try a higher resolution source image
- **Empty or minimal output** — the image may contain very little recognizable content
