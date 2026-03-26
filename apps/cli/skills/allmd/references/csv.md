# Convert CSV/TSV to Markdown

Reads a `.csv` or `.tsv` file, converts to a markdown table, and applies AI formatting.

## Conversion Workflow

1. **Validate** file exists and has `.csv` or `.tsv` extension
2. **Detect delimiter** — tabs vs commas (auto-detected for `.csv`, forced tab for `.tsv`)
3. **Parse** CSV with RFC 4180-compliant parser (handles quoted fields, escaped quotes)
4. **Build** markdown pipe table with header and separator rows
5. **AI format** — restructures into clean markdown via GPT-5-mini
6. **Add frontmatter** and output

## Key Details

- Custom CSV parser handles RFC 4180 edge cases (quoted fields, embedded commas, escaped double quotes)
- Auto-detects delimiter by comparing tab vs comma count in first line
- Title derived from filename via `titleFromFilename()`
- Rows are padded to match header column count

## Frontmatter Fields

```yaml
type: csv
title: "Data File"
source: "/path/to/data.csv"
rows: 150
delimiter: comma | tab
```

## CLI Usage

```bash
allmd csv data.csv
allmd csv data.csv -o data.md
allmd csv spreadsheet.tsv -o table.md
allmd csv "data/*.csv" -d output/
```

## Edge Cases

- **Large files**: Very large CSVs may exceed AI token limits
- **Mixed delimiters**: Auto-detection uses first line only; inconsistent delimiters may cause issues
- **Binary data**: Non-text content in cells will be included as-is
