import type { Command } from "commander";
import { convertWeb } from "../converters/web.js";
import { writeOutput } from "../utils/output.js";
import { createSpinner, error, success } from "../utils/ui.js";

export function registerWebCommand(program: Command): void {
  program
    .command("web")
    .description("Convert a website to markdown")
    .argument("<url>", "URL of the website to convert")
    .action(async (url: string) => {
      const opts = program.opts();
      const spinner = createSpinner(`Fetching ${url}...`);

      try {
        spinner.start();
        const result = await convertWeb(url, {
          output: opts.output,
          verbose: opts.verbose,
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
