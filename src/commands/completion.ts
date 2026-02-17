import type { Command } from "commander";
import tabtab from "tabtab";
import { error as errorMsg, success } from "../utils/ui.js";

const SUBCOMMANDS = [
  { name: "web", description: "Convert a website to markdown" },
  { name: "youtube", description: "Convert a YouTube video transcript" },
  { name: "yt", description: "Alias for youtube" },
  { name: "pdf", description: "Convert a PDF to markdown" },
  { name: "image", description: "Convert an image via AI vision" },
  { name: "video", description: "Convert video/audio via transcription" },
  { name: "gdoc", description: "Convert a Google Doc to markdown" },
  { name: "docx", description: "Convert a Word document to markdown" },
  { name: "epub", description: "Convert an EPUB ebook to markdown" },
  { name: "csv", description: "Convert a CSV/TSV file to markdown" },
  { name: "pptx", description: "Convert a PowerPoint to markdown" },
  { name: "tweet", description: "Convert a Tweet/X post to markdown" },
  { name: "rss", description: "Convert an RSS/Atom feed to markdown" },
  { name: "completion", description: "Manage shell completions" },
];

const GLOBAL_FLAGS = [
  { name: "--output", description: "Write output to file" },
  { name: "--verbose", description: "Enable verbose output" },
  { name: "--clipboard", description: "Read input from clipboard" },
  { name: "--copy", description: "Copy output to clipboard" },
  {
    name: "--output-dir",
    description: "Output directory for batch processing",
  },
  { name: "--parallel", description: "Number of parallel conversions" },
  { name: "--no-frontmatter", description: "Skip YAML frontmatter" },
  { name: "--help", description: "Show help" },
  { name: "--version", description: "Show version" },
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
        await tabtab.install({ name: "allmd", completer: "allmd" });
        success("Shell completions installed. Restart your shell to activate.");
      } catch (err) {
        errorMsg(err instanceof Error ? err.message : String(err));
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
      } catch (err) {
        errorMsg(err instanceof Error ? err.message : String(err));
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
