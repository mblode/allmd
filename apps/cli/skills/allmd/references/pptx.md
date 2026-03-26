# Convert PowerPoint to Markdown

Reads a `.pptx` file, extracts text and speaker notes from slide XML using adm-zip, and formats as markdown sections.

## Conversion Workflow

1. **Validate** file exists and has `.pptx` extension
2. **Unzip** PPTX (which is a ZIP archive) using `adm-zip`
3. **Extract slides** — parse `ppt/slides/slide*.xml` files, sorted by slide number
4. **Extract notes** — parse `ppt/notesSlides/notesSlide*.xml` files
5. **Build markdown** — each slide becomes a `## Slide N` section with text and optional speaker notes
6. **AI format** — restructures into clean markdown via GPT-5-mini
7. **Add frontmatter** and output

## Key Details

- Text extracted by parsing `<a:p>` (paragraph) and `<a:t>` (text run) XML elements
- Speaker notes included as blockquotes: `> Speaker notes: ...`
- Slides separated by `---` horizontal rules
- XML entities (`&amp;`, `&lt;`, etc.) properly decoded
- Slide number placeholders filtered from notes

## Frontmatter Fields

```yaml
type: pptx
title: "Presentation Title"
source: "/path/to/slides.pptx"
slides: 15
```

## CLI Usage

```bash
allmd pptx presentation.pptx
allmd pptx presentation.pptx -o slides.md
allmd pptx "decks/*.pptx" -d output/
```

## Edge Cases

- **Image-only slides**: Show as `(no text content)`
- **SmartArt/charts**: Text within SmartArt XML may not be fully extracted
- **Legacy `.ppt` format**: Not supported (only `.pptx`)
