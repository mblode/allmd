import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { formatAsMarkdown } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { applyFrontmatter } from "../utils/frontmatter.js";
import { titleFromFilename } from "../utils/slug.js";
import { verbose } from "../utils/ui.js";

function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0] ?? "";
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return tabs > commas ? "\t" : ",";
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      if (current.length === 0) {
        inQuotes = true;
      } else {
        current += char;
      }
    } else if (char === delimiter) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function csvToMarkdownTable(text: string, delimiter: string): string {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length === 0) {
    return "";
  }

  const rows = lines.map((line) => parseCsvLine(line, delimiter));
  const header = rows[0];
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
    return `| ${row.slice(0, colCount).join(" | ")} |`;
  });

  return [headerRow, separatorRow, ...dataRows].join("\n");
}

export async function convertCsv(
  filePath: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  verbose(`Reading CSV/TSV: ${filePath}`, options.verbose);
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

  const lines = content.split("\n").filter((l) => l.trim());
  const rowCount = Math.max(0, lines.length - 1);

  const markdownTable = csvToMarkdownTable(content, delimiter);
  verbose(
    `Converted to markdown table: ${rowCount} data rows`,
    options.verbose
  );

  const markdown = await formatAsMarkdown(
    markdownTable,
    {
      title: titleFromFilename(filePath),
      source: filePath,
      type: isTsv ? "TSV spreadsheet" : "CSV spreadsheet",
    },
    options.verbose
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
