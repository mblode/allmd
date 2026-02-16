import { access } from "node:fs/promises";
import type { Command } from "commander";
import { convertVideo } from "../converters/video.js";
import { writeOutput } from "../utils/output.js";
import { cleanFilePath } from "../utils/path.js";
import { createSpinner, error, success } from "../utils/ui.js";

export function registerVideoCommand(program: Command): void {
  program
    .command("video")
    .description("Convert a video/audio file to markdown via transcription")
    .argument("<file>", "Path to the video or audio file")
    .action(async (rawFile: string) => {
      const file = cleanFilePath(rawFile);
      const opts = program.opts();
      const spinner = createSpinner("Processing video...");

      try {
        await access(file);
      } catch {
        error(`File not found: ${file}`);
        process.exit(1);
      }

      try {
        spinner.start();
        spinner.text = "Extracting audio...";
        const result = await convertVideo(file, {
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
