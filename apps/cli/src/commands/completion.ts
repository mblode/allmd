import type { Command } from "commander";
import tabtab from "tabtab";

import { error as errorMsg, success } from "../utils/ui.js";

const SUBCOMMANDS = [
  { description: "Convert a website to markdown", name: "web" },
  { description: "Convert a YouTube video transcript", name: "youtube" },
  { description: "Alias for youtube", name: "yt" },
  { description: "Convert a PDF to markdown", name: "pdf" },
  { description: "Convert an image via AI vision", name: "image" },
  { description: "Convert video/audio via transcription", name: "video" },
  { description: "Convert a Google Doc to markdown", name: "gdoc" },
  { description: "Convert a Word document to markdown", name: "docx" },
  { description: "Convert an EPUB ebook to markdown", name: "epub" },
  { description: "Convert a CSV/TSV file to markdown", name: "csv" },
  { description: "Convert a PowerPoint to markdown", name: "pptx" },
  { description: "Convert a Tweet/X post to markdown", name: "tweet" },
  { description: "Convert an RSS/Atom feed to markdown", name: "rss" },
  { description: "Manage shell completions", name: "completion" },
];

const GLOBAL_FLAGS = [
  { description: "Write output to file", name: "--output" },
  { description: "Enable verbose output", name: "--verbose" },
  { description: "Read input from clipboard", name: "--clipboard" },
  { description: "Copy output to clipboard", name: "--copy" },
  {
    description: "Output directory for batch processing",
    name: "--output-dir",
  },
  { description: "Number of parallel conversions", name: "--parallel" },
  { description: "Skip YAML frontmatter", name: "--no-frontmatter" },
  { description: "Show help", name: "--help" },
  { description: "Show version", name: "--version" },
];

export function registerCompletionCommand(program: Command): void {
  const cmd = program
    .command("completion")
    .description("Manage shell completions (install/uninstall)");

  cmd
    .command("install")
    .description("Install shell completions for bash/zsh/fish")
    .action(async () => {
      try {
        await tabtab.install({ completer: "allmd", name: "allmd" });
        success("Shell completions installed. Restart your shell to activate.");
      } catch (error) {
        errorMsg(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  cmd
    .command("uninstall")
    .description("Remove shell completions")
    .action(async () => {
      try {
        await tabtab.uninstall({ name: "allmd" });
        success("Shell completions removed.");
      } catch (error) {
        errorMsg(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

export function handleTabCompletion(): boolean {
  const env = tabtab.parseEnv(process.env);
  if (!env.complete) {
    return false;
  }

  if (env.prev === "allmd" || env.prev === "--") {
    tabtab.log([...SUBCOMMANDS, ...GLOBAL_FLAGS]);
  } else if (env.prev === "--output" || env.prev === "-o") {
    // File completion handled by shell
    tabtab.log([]);
  } else if (env.prev === "--output-dir" || env.prev === "-d") {
    // Directory completion handled by shell
    tabtab.log([]);
  } else if (env.prev === "--parallel") {
    tabtab.log(["1", "2", "3", "4", "5", "8", "10"]);
  } else if (env.lastPartial.startsWith("-")) {
    tabtab.log(GLOBAL_FLAGS);
  } else {
    tabtab.log(SUBCOMMANDS);
  }

  return true;
}
