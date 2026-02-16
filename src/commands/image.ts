import { access } from "node:fs/promises";
import type { Command } from "commander";
import { convertImage } from "../converters/image.js";
import { writeOutput } from "../utils/output.js";
import { cleanFilePath } from "../utils/path.js";
import { createSpinner, error, success } from "../utils/ui.js";

export function registerImageCommand(program: Command): void {
  program
    .command("image")
    .description("Convert an image to markdown via AI vision")
    .argument("<file>", "Path to the image file")
    .action(async (rawFile: string) => {
      const file = cleanFilePath(rawFile);
      const opts = program.opts();
      const spinner = createSpinner("Analyzing image...");

      try {
        await access(file);
      } catch {
        error(`File not found: ${file}`);
        process.exit(1);
      }

      try {
        spinner.start();
        const result = await convertImage(file, {
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
