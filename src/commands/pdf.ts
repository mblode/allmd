import { access } from "node:fs/promises";
import type { Command } from "commander";
import { convertPdf } from "../converters/pdf.js";
import { writeOutput } from "../utils/output.js";
import { cleanFilePath } from "../utils/path.js";
import { createSpinner, error, success } from "../utils/ui.js";

export function registerPdfCommand(program: Command): void {
  program
    .command("pdf")
    .description("Convert a PDF to markdown")
    .argument("<file>", "Path to the PDF file")
    .action(async (rawFile: string) => {
      const file = cleanFilePath(rawFile);
      const opts = program.opts();
      const spinner = createSpinner("Extracting PDF content...");

      try {
        await access(file);
      } catch {
        error(`File not found: ${file}`);
        process.exit(1);
      }

      try {
        spinner.start();
        const result = await convertPdf(file, {
          ai: opts.ai !== false,
          output: opts.output,
        });
        spinner.stop();

        await writeOutput(result.markdown, { output: opts.output });
        if (opts.output) {
          success(`Saved to ${opts.output}`);
        }
      } catch (err) {
        spinner.stop();
        error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}
