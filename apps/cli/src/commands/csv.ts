import type { Command } from "commander";

import { convertCsv } from "../converters/csv.js";
import { createFileCommand } from "../utils/command.js";

export function registerCsvCommand(program: Command): void {
  createFileCommand({
    argument: "file",
    converter: convertCsv,
    description: "Convert a CSV or TSV file to markdown",
    extensions: [".csv", ".tsv"],
    helpText: `Examples:
  allmd csv data.csv
  allmd csv data.tsv -o table.md`,
    name: "csv",
    spinnerText: "Converting spreadsheet data...",
  })(program);
}
