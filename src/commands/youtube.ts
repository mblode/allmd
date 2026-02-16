import type { Command } from "commander";
import { convertYoutube } from "../converters/youtube.js";
import { writeOutput } from "../utils/output.js";
import { createSpinner, error, success } from "../utils/ui.js";

export function registerYoutubeCommand(program: Command): void {
  program
    .command("youtube")
    .alias("yt")
    .description("Convert a YouTube video transcript to markdown")
    .argument("<url>", "YouTube video URL")
    .action(async (url: string) => {
      const opts = program.opts();
      const spinner = createSpinner("Fetching transcript...");

      try {
        spinner.start();
        const result = await convertYoutube(url, {
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
