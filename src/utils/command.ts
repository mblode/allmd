import { access } from "node:fs/promises";
import type { Command } from "commander";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { expandGlob, isGlobPattern, processBatch } from "./batch.js";
import { readClipboard } from "./clipboard.js";
import { generateOutputPath, writeOutput } from "./output.js";
import { cleanFilePath } from "./path.js";
import { isStdinPiped, readStdin } from "./stdin.js";
import { createSpinner, error, formatError, info, success } from "./ui.js";

type Converter = (
  input: string,
  opts: ConversionOptions
) => Promise<ConversionResult>;

interface FileCommandConfig {
  argument: string;
  converter: Converter;
  description: string;
  extensions: string[];
  helpText: string;
  name: string;
  spinnerText?: string;
}

interface UrlCommandConfig {
  aliases?: string[];
  argument: string;
  converter: Converter;
  description: string;
  helpText: string;
  name: string;
  spinnerText?: string;
  validate?: (url: string) => string | null;
}

function resolveInput(
  rawInput: string | undefined,
  clipboard: boolean,
  errorMsg: string
): Promise<string> | never {
  if (rawInput) {
    return Promise.resolve(rawInput);
  }
  if (clipboard) {
    return readClipboard();
  }
  if (isStdinPiped()) {
    return readStdin();
  }
  error(errorMsg);
  process.exit(1);
}

async function handleBatchConversion(
  files: string[],
  converter: Converter,
  opts: Record<string, unknown>
): Promise<void> {
  info(`Found ${files.length} file(s) matching pattern`);
  const spinner = createSpinner(`Converting 0/${files.length} files...`);
  spinner.start();

  const result = await processBatch(
    files,
    converter,
    {
      output: opts.output as string | undefined,
      verbose: opts.verbose as boolean | undefined,
      frontmatter: opts.frontmatter as boolean | undefined,
      diarize: opts.diarize as boolean | undefined,
      speakerReferences: opts.speakerReferences as string[] | undefined,
      speakers: opts.speakers as string[] | undefined,
    },
    {
      parallel: Number.parseInt(opts.parallel as string, 10) || 3,
      outputDir: opts.outputDir as string | undefined,
      copy: opts.copy as boolean | undefined,
    },
    (completed, total) => {
      spinner.text = `Converting ${completed}/${total} files...`;
    }
  );

  spinner.stop();
  if (opts.copy) {
    success("Copied to clipboard");
  }
  info(
    `Converted ${result.succeeded}/${result.total} files${result.failed > 0 ? ` (${result.failed} failed)` : ""}`
  );
}

async function runSingleConversion(
  input: string,
  converter: Converter,
  opts: Record<string, unknown>,
  spinnerText: string
): Promise<void> {
  const spinner = createSpinner(spinnerText);

  try {
    spinner.start();
    const result = await converter(input, {
      output: opts.output as string | undefined,
      verbose: opts.verbose as boolean | undefined,
      frontmatter: opts.frontmatter as boolean | undefined,
      diarize: opts.diarize as boolean | undefined,
      speakerReferences: opts.speakerReferences as string[] | undefined,
      speakers: opts.speakers as string[] | undefined,
    });
    spinner.stop();

    const outputPath = opts.stdout
      ? undefined
      : ((opts.output as string | undefined) ??
        generateOutputPath(result.title, opts.outputDir as string | undefined));
    await writeOutput(result.markdown, {
      output: outputPath,
      copy: opts.copy as boolean | undefined,
    });
    if (opts.copy) {
      success("Copied to clipboard");
    }
    if (outputPath) {
      success(`Saved to ${outputPath}`);
    }
  } catch (err) {
    spinner.stop();
    error(formatError(err));
    process.exit(1);
  }
}

export function createFileCommand(
  config: FileCommandConfig
): (program: Command) => void {
  return (program: Command) => {
    program
      .command(config.name)
      .description(config.description)
      .argument(
        `[${config.argument}]`,
        `Path to the ${config.extensions.join(" / ")} file (supports glob patterns)`
      )
      .addHelpText("after", `\n${config.helpText}`)
      .action(async (rawArg?: string) => {
        const opts = program.opts();

        const input = await resolveInput(
          rawArg,
          opts.clipboard,
          "No file provided. Pass a file path as an argument, use --clipboard, or pipe one via stdin."
        );

        if (isGlobPattern(input)) {
          const files = await expandGlob(input);
          if (files.length === 0) {
            error(`No files matched pattern: ${input}`);
            process.exit(1);
          }
          await handleBatchConversion(files, config.converter, opts);
          return;
        }

        const file = cleanFilePath(input);

        if (!file) {
          error(
            "No file provided. Pass a file path as an argument, use --clipboard, or pipe one via stdin."
          );
          process.exit(1);
        }

        try {
          await access(file);
        } catch {
          error(`File not found: ${file}`);
          process.exit(1);
        }

        await runSingleConversion(
          file,
          config.converter,
          opts,
          config.spinnerText ?? "Converting..."
        );
      });
  };
}

export function createUrlCommand(
  config: UrlCommandConfig
): (program: Command) => void {
  return (program: Command) => {
    const cmd = program
      .command(config.name)
      .description(config.description)
      .argument(`[${config.argument}]`, "URL to convert")
      .addHelpText("after", `\n${config.helpText}`);

    if (config.aliases) {
      for (const alias of config.aliases) {
        cmd.alias(alias);
      }
    }

    cmd.action(async (rawUrl?: string) => {
      const opts = program.opts();

      const url = await resolveInput(
        rawUrl,
        opts.clipboard,
        "No URL provided. Pass a URL as an argument, use --clipboard, or pipe one via stdin."
      );

      if (config.validate) {
        const validationError = config.validate(url);
        if (validationError) {
          error(validationError);
          process.exit(1);
        }
      }

      await runSingleConversion(
        url,
        config.converter,
        opts,
        config.spinnerText ?? "Converting..."
      );
    });
  };
}
