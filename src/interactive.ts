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
import { generateOutputPath, writeOutput } from "./utils/output.js";
import { cleanFilePath } from "./utils/path.js";
import { formatError } from "./utils/ui.js";

const CONVERTERS = {
  youtube: { label: "YouTube video", inputType: "url" as const },
  web: { label: "Website", inputType: "url" as const },
  video: { label: "Video / audio file", inputType: "file" as const },
  image: { label: "Image file", inputType: "file" as const },
  gdoc: { label: "Google Doc", inputType: "url" as const },
  pdf: { label: "PDF file", inputType: "file" as const },
  docx: { label: "Word document", inputType: "file" as const },
  epub: { label: "EPUB ebook", inputType: "file" as const },
  csv: { label: "CSV / TSV file", inputType: "file" as const },
  pptx: { label: "PowerPoint presentation", inputType: "file" as const },
  tweet: { label: "Tweet / X post", inputType: "url" as const },
  rss: { label: "RSS / Atom feed", inputType: "url" as const },
} as const;

type ConverterKey = keyof typeof CONVERTERS;

const converterFns: Record<
  ConverterKey,
  (input: string, opts: ConversionOptions) => Promise<ConversionResult>
> = {
  youtube: convertYoutube,
  web: convertWeb,
  video: convertVideo,
  image: convertImage,
  gdoc: convertGdoc,
  pdf: convertPdf,
  docx: convertDocx,
  epub: convertEpub,
  csv: convertCsv,
  pptx: convertPptx,
  tweet: convertTweet,
  rss: convertRss,
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
      value: value as ConverterKey,
      label,
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
      if (!v.trim()) {
        return "Input is required";
      }
    },
  });
  if (isCancel(input)) {
    cancelled();
  }

  const options: ConversionOptions = {};

  const s = spinner();
  s.start("Converting...");

  try {
    const cleanInput =
      converter.inputType === "file" ? cleanFilePath(input) : input;
    const result = await converterFns[type](cleanInput, options);
    s.stop("Conversion complete!");

    const outputPath = generateOutputPath(result.title);
    await writeOutput(result.markdown, { output: outputPath });
    note(`Saved to ${outputPath}`, "Output");
  } catch (err) {
    s.stop("Conversion failed.");
    log.error(formatError(err));
    process.exit(1);
  }

  outro(chalk.green("Done!"));
}
