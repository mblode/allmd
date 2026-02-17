import "dotenv/config";
import { Command } from "commander";
import updateNotifier from "update-notifier";
import {
  handleTabCompletion,
  registerCompletionCommand,
} from "./commands/completion.js";
import { registerCsvCommand } from "./commands/csv.js";
import { registerDocxCommand } from "./commands/docx.js";
import { registerEpubCommand } from "./commands/epub.js";
import { registerExamplesCommand } from "./commands/examples.js";
import { registerGdocCommand } from "./commands/gdoc.js";
import { registerImageCommand } from "./commands/image.js";
import { registerPdfCommand } from "./commands/pdf.js";
import { registerPptxCommand } from "./commands/pptx.js";
import { registerRssCommand } from "./commands/rss.js";
import { registerTweetCommand } from "./commands/tweet.js";
import { registerVideoCommand } from "./commands/video.js";
import { registerWebCommand } from "./commands/web.js";
import { registerYoutubeCommand } from "./commands/youtube.js";
import { convertCsv } from "./converters/csv.js";
import { convertDocx } from "./converters/docx.js";
import { convertEpub } from "./converters/epub.js";
import { convertGdoc } from "./converters/gdoc.js";
import { convertImage } from "./converters/image.js";
import { convertPdf } from "./converters/pdf.js";
import { convertPptx } from "./converters/pptx.js";
import { convertRss } from "./converters/rss.js";
import { convertTweet } from "./converters/tweet.js";
import { convertVideo } from "./converters/video.js";
import { convertWeb } from "./converters/web.js";
import { convertYoutube } from "./converters/youtube.js";
import { runInteractive } from "./interactive.js";
import type { ConversionOptions, ConversionResult } from "./types.js";
import { loadConfig, mergeWithCliOpts } from "./utils/config.js";
import { classifyFile, classifyInput, classifyURL } from "./utils/detect.js";
import { generateOutputPath, writeOutput } from "./utils/output.js";
import { cleanFilePath } from "./utils/path.js";
import {
  createSpinner,
  error,
  formatError,
  info,
  success,
} from "./utils/ui.js";

const notifier = updateNotifier({
  pkg: { name: "allmd", version: "1.0.1" },
  updateCheckInterval: 1000 * 60 * 60 * 24, // 1 day
});
notifier.notify({ defer: true });

const program = new Command();

program
  .name("allmd")
  .description("Convert various content types to markdown")
  .version("1.0.1")
  .addHelpText(
    "after",
    "\nQuick start:\n  $ allmd <url-or-file>              Auto-detect and convert\n  $ allmd web https://example.com    Convert a specific type\n  $ allmd examples                   Show more usage examples\n\nRequires OPENAI_API_KEY in .env or environment for AI formatting."
  );

program.option("-o, --output <file>", "Write output to a specific file");
program.option("-v, --verbose", "Enable verbose output");
program.option("-c, --clipboard", "Read input from clipboard");
program.option("--copy", "Copy output to clipboard");
program.option(
  "-d, --output-dir <dir>",
  "Output directory for converted files"
);
program.option("--stdout", "Print output to stdout instead of writing a file");
program.option(
  "--parallel <n>",
  "Number of parallel conversions (default: 3)",
  "3"
);
program.option("--no-frontmatter", "Skip YAML frontmatter in output");
program.option(
  "--no-diarize",
  "Disable speaker diarization (video/audio only)"
);
program.option(
  "--speakers <names>",
  "Speaker names, comma-separated. Use with --speaker-references for known-speaker matching (implies --diarize).",
  (val: string) => val.split(",").map((s: string) => s.trim())
);
program.option(
  "--speaker-references <reference>",
  "Known speaker reference clip (file path or data URL). Repeat up to 4 times. Requires --speakers and implies --diarize.",
  (value: string, previous: string[] = []) => [...previous, value.trim()],
  []
);

registerWebCommand(program);
registerYoutubeCommand(program);
registerVideoCommand(program);
registerImageCommand(program);
registerGdocCommand(program);
registerPdfCommand(program);
registerDocxCommand(program);
registerEpubCommand(program);
registerCsvCommand(program);
registerPptxCommand(program);
registerTweetCommand(program);
registerRssCommand(program);
registerCompletionCommand(program);
registerExamplesCommand(program);

program.hook("preAction", async () => {
  const config = await loadConfig();
  const cliOpts = program.opts();
  const merged = mergeWithCliOpts(cliOpts, config);
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && cliOpts[key] === undefined) {
      program.setOptionValue(key, value);
    }
  }
});

const DETECTION_LABELS: Record<string, string> = {
  youtube: "YouTube video",
  gdoc: "Google Doc",
  tweet: "Tweet / X post",
  rss: "RSS / Atom feed",
  web: "web page",
  pdf: "PDF document",
  image: "image",
  video: "video file",
  audio: "audio file",
  docx: "Word document",
  epub: "EPUB ebook",
  csv: "CSV / TSV file",
  pptx: "PowerPoint presentation",
};

const urlConverters: Record<
  string,
  (input: string, opts: ConversionOptions) => Promise<ConversionResult>
> = {
  youtube: convertYoutube,
  gdoc: convertGdoc,
  tweet: convertTweet,
  rss: convertRss,
  web: convertWeb,
};

const fileConverters: Record<
  string,
  (input: string, opts: ConversionOptions) => Promise<ConversionResult>
> = {
  pdf: convertPdf,
  image: convertImage,
  video: convertVideo,
  audio: convertVideo,
  docx: convertDocx,
  epub: convertEpub,
  csv: convertCsv,
  pptx: convertPptx,
};

async function executeConversion(
  converter: (
    input: string,
    opts: ConversionOptions
  ) => Promise<ConversionResult>,
  input: string,
  conversionOpts: ConversionOptions,
  opts: Record<string, unknown>
): Promise<void> {
  const spinner = createSpinner("Converting...");
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
    error(formatError(err));
    process.exit(1);
  }
}

async function handleAutoDetect(input: string): Promise<void> {
  const opts = program.opts();
  const conversionOpts: ConversionOptions = {
    output: opts.output,
    verbose: opts.verbose,
    frontmatter: opts.frontmatter,
    diarize: opts.diarize as boolean | undefined,
    speakerReferences: opts.speakerReferences as string[] | undefined,
    speakers: opts.speakers as string[] | undefined,
  };
  const { type } = classifyInput(input);

  if (type === "url") {
    const urlType = classifyURL(input);
    const converter = urlConverters[urlType];
    if (!converter) {
      await runInteractive();
      return;
    }

    info(`Detected: ${DETECTION_LABELS[urlType]}. Converting...`);
    await executeConversion(converter, input, conversionOpts, opts);
    return;
  }

  if (type === "file") {
    const fileType = classifyFile(input);
    const converter = fileConverters[fileType];
    if (!converter) {
      info("Could not detect file type. Launching interactive mode...");
      await runInteractive();
      return;
    }

    info(`Detected: ${DETECTION_LABELS[fileType]}. Converting...`);
    await executeConversion(
      converter,
      cleanFilePath(input),
      conversionOpts,
      opts
    );
    return;
  }

  await runInteractive();
}

program
  .argument("[input]", "URL or file path to convert (auto-detects type)")
  .action(async (input?: string) => {
    if (input) {
      await handleAutoDetect(input);
    } else {
      await runInteractive();
    }
  });

if (handleTabCompletion()) {
  process.exit(0);
}

program.parse();
