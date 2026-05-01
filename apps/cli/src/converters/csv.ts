import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { formatAsMarkdown } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { applyFrontmatter } from "../utils/frontmatter.js";
import { titleFromFilename } from "../utils/slug.js";
import { trackProgress, verbose } from "../utils/ui.js";

function detectDelimiter(text: string): string {
  let tabs = 0;
  let commas = 0;
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && (char === "\n" || char === "\r")) {
      break;
    }
    if (!inQuotes && char === "\t") {
      tabs++;
    }
    if (!inQuotes && char === ",") {
      commas++;
    }
  }

  return tabs > commas ? "\t" : ",";
}

function parseCsvRows(text: string, delimiter: string): string[][] {
  const state = {
    current: "",
    inQuotes: false,
    row: [] as string[],
    rows: [] as string[][],
  };

  for (let i = 0; i < text.length; i++) {
    i = state.inQuotes
      ? readQuotedChar(text, i, state)
      : readUnquotedChar(text, i, delimiter, state);
  }
  if (state.current.length > 0 || state.row.length > 0) {
    pushRow(state);
  }
  return state.rows;
}

interface CsvParserState {
  current: string;
  inQuotes: boolean;
  row: string[];
  rows: string[][];
}

function pushField(state: CsvParserState): void {
  state.row.push(state.current.trim());
  state.current = "";
}

function pushRow(state: CsvParserState): void {
  pushField(state);
  if (state.row.some((field) => field.length > 0)) {
    state.rows.push(state.row);
  }
  state.row = [];
}

function readQuotedChar(
  text: string,
  index: number,
  state: CsvParserState
): number {
  const char = text[index];
  if (char !== '"') {
    state.current += char;
    return index;
  }
  if (text[index + 1] === '"') {
    state.current += '"';
    return index + 1;
  }
  state.inQuotes = false;
  return index;
}

function readUnquotedChar(
  text: string,
  index: number,
  delimiter: string,
  state: CsvParserState
): number {
  const char = text[index];
  if (char === '"') {
    state.inQuotes = state.current.length === 0;
    if (!state.inQuotes) {
      state.current += char;
    }
    return index;
  }
  if (char === delimiter) {
    pushField(state);
    return index;
  }
  if (char === "\n" || char === "\r") {
    pushRow(state);
    return char === "\r" && text[index + 1] === "\n" ? index + 1 : index;
  }
  state.current += char;
  return index;
}

function escapeMarkdownTableCell(cell: string): string {
  return cell.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
}

function csvToMarkdownTable(text: string, delimiter: string): string {
  const rows = parseCsvRows(text, delimiter);
  if (rows.length === 0) {
    return "";
  }

  const header = rows[0].map(escapeMarkdownTableCell);
  if (!header) {
    return "";
  }

  const colCount = header.length;
  const headerRow = `| ${header.join(" | ")} |`;
  const separatorRow = `| ${header.map(() => "---").join(" | ")} |`;

  const dataRows = rows.slice(1).map((row) => {
    while (row.length < colCount) {
      row.push("");
    }
    return `| ${row.slice(0, colCount).map(escapeMarkdownTableCell).join(" | ")} |`;
  });

  return [headerRow, separatorRow, ...dataRows].join("\n");
}

export async function convertCsv(
  filePath: string,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  verbose(`Reading CSV/TSV: ${filePath}`, options.verbose);
  options.onProgress?.("Parsing spreadsheet...");
  const content = await readFile(filePath, "utf-8");
  const ext = extname(filePath).toLowerCase();
  const isTsv = ext === ".tsv";

  verbose(
    `File size: ${content.length.toLocaleString()} chars`,
    options.verbose
  );

  const delimiter = isTsv ? "\t" : detectDelimiter(content);
  verbose(
    `Detected delimiter: ${delimiter === "\t" ? "tab" : "comma"}`,
    options.verbose
  );

  const markdownTable = csvToMarkdownTable(content, delimiter);
  const rowCount = Math.max(0, parseCsvRows(content, delimiter).length - 1);
  verbose(
    `Converted to markdown table: ${rowCount} data rows`,
    options.verbose
  );

  const markdown = await trackProgress(
    options.onProgress,
    "Formatting with AI...",
    formatAsMarkdown(
      markdownTable,
      {
        title: titleFromFilename(filePath),
        source: filePath,
        type: isTsv ? "TSV spreadsheet" : "CSV spreadsheet",
      },
      options
    )
  );

  const title = titleFromFilename(filePath);

  const withFrontmatter = applyFrontmatter(markdown, options, {
    title,
    source: filePath,
    type: "csv",
    rows: rowCount,
    delimiter: delimiter === "\t" ? "tab" : "comma",
  });

  verbose(
    `Final output: ${withFrontmatter.length.toLocaleString()} chars`,
    options.verbose
  );

  return {
    title,
    markdown: withFrontmatter,
    rawContent: content,
    metadata: { rows: rowCount, delimiter },
  };
}
