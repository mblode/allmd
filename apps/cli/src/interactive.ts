import {
  cancel,
  intro,
  isCancel,
  log,
  note,
  outro,
  select,
  spinner,
  text,
} from "@clack/prompts";
import chalk from "chalk";

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
import type { ConversionOptions, ConversionResult } from "./types.js";
import {
  beginInterruptibleOperation,
  clearInterruptibleOperation,
  isInterruptedError,
} from "./utils/interrupt.js";
import { assertRequiredApiKeys } from "./utils/keys.js";
import { generateOutputPath, writeOutput } from "./utils/output.js";
import { cleanFilePath } from "./utils/path.js";
import { formatError } from "./utils/ui.js";

const CONVERTERS = {
  csv: { inputType: "file" as const, label: "CSV / TSV file" },
  docx: { inputType: "file" as const, label: "Word document" },
  epub: { inputType: "file" as const, label: "EPUB ebook" },
  gdoc: { inputType: "url" as const, label: "Google Doc" },
  image: { inputType: "file" as const, label: "Image file" },
  pdf: { inputType: "file" as const, label: "PDF file" },
  pptx: { inputType: "file" as const, label: "PowerPoint presentation" },
  rss: { inputType: "url" as const, label: "RSS / Atom feed" },
  tweet: { inputType: "url" as const, label: "Tweet / X post" },
  video: { inputType: "file" as const, label: "Video / audio file" },
  web: { inputType: "url" as const, label: "Website" },
  youtube: { inputType: "url" as const, label: "YouTube video" },
} as const;

type ConverterKey = keyof typeof CONVERTERS;

const converterFns: Record<
  ConverterKey,
  (input: string, opts: ConversionOptions) => Promise<ConversionResult>
> = {
  csv: convertCsv,
  docx: convertDocx,
  epub: convertEpub,
  gdoc: convertGdoc,
  image: convertImage,
  pdf: convertPdf,
  pptx: convertPptx,
  rss: convertRss,
  tweet: convertTweet,
  video: convertVideo,
  web: convertWeb,
  youtube: convertYoutube,
};

function cancelled(): never {
  cancel("Cancelled.");
  process.exit(0);
}

export async function runInteractive(): Promise<void> {
  intro(chalk.cyan("allmd"));

  const type = await select({
    message: "What would you like to convert?",
    options: Object.entries(CONVERTERS).map(([value, { label }]) => ({
      label,
      value: value as ConverterKey,
    })),
  });
  if (isCancel(type)) {
    cancelled();
  }

  const converter = CONVERTERS[type];
  const input = await text({
    message:
      converter.inputType === "url" ? "Enter the URL:" : "Enter the file path:",
    validate: (v) => {
      if (!v?.trim()) {
        return "Input is required";
      }
    },
  });
  if (isCancel(input)) {
    cancelled();
  }

  const s = spinner();
  let spinnerStarted = false;
  const abortController = beginInterruptibleOperation();
  const options: ConversionOptions = {
    abortSignal: abortController.signal,
    onProgress: (message) => {
      s.message(message);
    },
  };

  try {
    assertRequiredApiKeys({
      firecrawl: type === "web",
      openai: type !== "web",
    });

    s.start("Converting...");
    spinnerStarted = true;
    const cleanInput =
      converter.inputType === "file" ? cleanFilePath(input) : input;
    const result = await converterFns[type](cleanInput, options);
    s.stop("Conversion complete!");

    const outputPath = generateOutputPath(result.title);
    await writeOutput(result.markdown, { output: outputPath });
    note(`Saved to ${outputPath}`, "Output");
  } catch (error) {
    if (spinnerStarted) {
      s.stop("Conversion failed.");
    }
    if (isInterruptedError(error)) {
      process.exit(130);
    }
    log.error(formatError(error));
    process.exit(1);
  } finally {
    clearInterruptibleOperation(abortController);
  }

  outro(chalk.green("Done!"));
}
