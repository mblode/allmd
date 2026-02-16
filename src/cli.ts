import "dotenv/config";
import { Command } from "commander";
import { registerGdocCommand } from "./commands/gdoc.js";
import { registerImageCommand } from "./commands/image.js";
import { registerPdfCommand } from "./commands/pdf.js";
import { registerVideoCommand } from "./commands/video.js";
import { registerWebCommand } from "./commands/web.js";
import { registerYoutubeCommand } from "./commands/youtube.js";
import { runInteractive } from "./interactive.js";

const program = new Command();

program
  .name("md")
  .description("Convert various content types to markdown")
  .version("1.0.0");

program.option("-o, --output <file>", "Write output to file instead of stdout");

registerWebCommand(program);
registerYoutubeCommand(program);
registerVideoCommand(program);
registerImageCommand(program);
registerGdocCommand(program);
registerPdfCommand(program);

program.action(async () => {
  await runInteractive();
});

program.parse();
