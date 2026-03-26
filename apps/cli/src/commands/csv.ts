import type { Command } from "commander";
import { convertCsv } from "../converters/csv.js";
import { createFileCommand } from "../utils/command.js";

export function registerCsvCommand(program: Command): void {
  createFileCommand({
    name: "csv",
    description: "Convert a CSV or TSV file to markdown",
    argument: "file",
    extensions: [".csv", ".tsv"],
    converter: convertCsv,
    spinnerText: "Converting spreadsheet data...",
    helpText: `Examples:
  allmd csv data.csv
  allmd csv data.tsv -o table.md`,
  })(program);
}
