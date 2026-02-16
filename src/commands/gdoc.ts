import type { Command } from "commander";
import { convertGdoc } from "../converters/gdoc.js";
import { writeOutput } from "../utils/output.js";
import { createSpinner, error, success } from "../utils/ui.js";

export function registerGdocCommand(program: Command): void {
  program
    .command("gdoc")
    .description("Convert a public Google Doc to markdown")
    .argument("<url>", "Google Docs URL")
    .action(async (url: string) => {
      const opts = program.opts();
      const spinner = createSpinner("Fetching Google Doc...");

      try {
        spinner.start();
        const result = await convertGdoc(url, {
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
