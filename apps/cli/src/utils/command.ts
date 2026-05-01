import { access } from "node:fs/promises";
import type { Command } from "commander";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { expandGlob, isGlobPattern, processBatch } from "./batch.js";
import { readClipboard } from "./clipboard.js";
import {
  beginInterruptibleOperation,
  clearInterruptibleOperation,
  isInterruptedError,
} from "./interrupt.js";
import { assertRequiredApiKeys } from "./keys.js";
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
  requiresFirecrawl?: boolean;
  requiresOpenAI?: boolean;
  spinnerText?: string;
}

interface UrlCommandConfig {
  aliases?: string[];
  argument: string;
  converter: Converter;
  description: string;
  helpText: string;
  name: string;
  requiresFirecrawl?: boolean;
  requiresOpenAI?: boolean;
  spinnerText?: string;
  validate?: (url: string) => string | null;
}

function resolveInput(
  rawInput: string | undefined,
  clipboard: boolean,
  errorMsg: string
): Promise<string> | never {
  if (rawInput === "-") {
    return readStdin();
  }
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

function exitWithFormattedError(err: unknown): never {
  if (isInterruptedError(err)) {
    process.exit(130);
  }
  error(formatError(err));
  process.exit(1);
}

async function handleBatchConversion(
  files: string[],
  converter: Converter,
  opts: Record<string, unknown>
): Promise<void> {
  info(`Found ${files.length} file(s) matching pattern`);
  const spinner = createSpinner(`Converting 0/${files.length} files...`);
  const abortController = beginInterruptibleOperation();
  spinner.start();

  try {
    const parsedParallel = Number.parseInt(opts.parallel as string, 10);
    const parallel = Number.isFinite(parsedParallel)
      ? Math.max(1, parsedParallel)
      : 3;
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
        abortSignal: abortController.signal,
      },
      {
        parallel,
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
    if (result.failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    spinner.stop();
    exitWithFormattedError(err);
  } finally {
    clearInterruptibleOperation(abortController);
  }
}

async function runSingleConversion(
  input: string,
  converter: Converter,
  opts: Record<string, unknown>,
  spinnerText: string
): Promise<void> {
  const spinner = createSpinner(spinnerText);
  const abortController = beginInterruptibleOperation();
  const conversionOpts: ConversionOptions = {
    abortSignal: abortController.signal,
    output: opts.output as string | undefined,
    verbose: opts.verbose as boolean | undefined,
    frontmatter: opts.frontmatter as boolean | undefined,
    diarize: opts.diarize as boolean | undefined,
    speakerReferences: opts.speakerReferences as string[] | undefined,
    speakers: opts.speakers as string[] | undefined,
    onProgress: (message) => {
      spinner.text = message;
    },
  };

  try {
    spinner.start();
    const result = await converter(input, conversionOpts);
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
    if (isInterruptedError(err)) {
      process.exit(130);
    }
    error(formatError(err));
    process.exit(1);
  } finally {
    clearInterruptibleOperation(abortController);
  }
}

async function handleGlobInput(
  input: string,
  opts: Record<string, unknown>,
  config: FileCommandConfig
): Promise<boolean> {
  if (!isGlobPattern(input)) {
    return false;
  }
  if (opts.output) {
    throw new Error(
      "--output cannot be used with multiple files. Use --output-dir instead."
    );
  }
  const files = await expandGlob(input);
  if (files.length === 0) {
    throw new Error(`No files matched pattern: ${input}`);
  }
  assertRequiredApiKeys({
    openai: config.requiresOpenAI ?? true,
    firecrawl: config.requiresFirecrawl,
  });
  await handleBatchConversion(files, config.converter, opts);
  return true;
}

async function handleSingleFileInput(
  input: string,
  opts: Record<string, unknown>,
  config: FileCommandConfig
): Promise<void> {
  const file = cleanFilePath(input);

  if (!file) {
    throw new Error(
      "No file provided. Pass a file path as an argument, use --clipboard, or pipe one via stdin."
    );
  }

  try {
    await access(file);
  } catch {
    throw new Error(`File not found: ${file}`);
  }

  assertRequiredApiKeys({
    openai: config.requiresOpenAI ?? true,
    firecrawl: config.requiresFirecrawl,
  });

  await runSingleConversion(
    file,
    config.converter,
    opts,
    config.spinnerText ?? "Converting..."
  );
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
        try {
          const opts = program.opts();

          const input = await resolveInput(
            rawArg,
            opts.clipboard,
            "No file provided. Pass a file path as an argument, use --clipboard, or pipe one via stdin."
          );

          if (await handleGlobInput(input, opts, config)) {
            return;
          }

          await handleSingleFileInput(input, opts, config);
        } catch (err) {
          exitWithFormattedError(err);
        }
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
      try {
        const opts = program.opts();

        const url = await resolveInput(
          rawUrl,
          opts.clipboard,
          "No URL provided. Pass a URL as an argument, use --clipboard, or pipe one via stdin."
        );

        if (config.validate) {
          const validationError = config.validate(url);
          if (validationError) {
            throw new Error(validationError);
          }
        }

        assertRequiredApiKeys({
          openai: config.requiresOpenAI ?? true,
          firecrawl: config.requiresFirecrawl,
        });

        await runSingleConversion(
          url,
          config.converter,
          opts,
          config.spinnerText ?? "Converting..."
        );
      } catch (err) {
        exitWithFormattedError(err);
      }
    });
  };
}
