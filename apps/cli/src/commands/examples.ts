import type { Command } from "commander";

const EXAMPLES = `
Common Workflows:

  Auto-detect input type:
    $ allmd https://example.com
    $ allmd document.pdf
    $ allmd recording.mp4

  Save to file:
    $ allmd web https://example.com -o article.md
    $ allmd pdf report.pdf -o report.md

  Batch convert:
    $ allmd pdf '*.pdf' -d output/
    $ allmd image 'screenshots/*.png' -d descriptions/

  Clipboard:
    $ allmd web --clipboard          # read URL from clipboard
    $ allmd pdf report.pdf --copy    # copy output to clipboard

  Pipe input:
    $ echo 'https://example.com' | allmd web
    $ pbpaste | allmd web

  Skip frontmatter:
    $ allmd web https://example.com --no-frontmatter

  Supported formats:
    web       Website / URL           allmd web <url>
    youtube   YouTube transcript      allmd youtube <url>
    pdf       PDF document            allmd pdf <file>
    docx      Word document           allmd docx <file>
    epub      EPUB ebook              allmd epub <file>
    csv       CSV / TSV file          allmd csv <file>
    pptx      PowerPoint slides       allmd pptx <file>
    image     Image (AI vision)       allmd image <file>
    video     Video / audio           allmd video <file>
    gdoc      Google Doc              allmd gdoc <url>
    tweet     Tweet / X post          allmd tweet <url>
    rss       RSS / Atom feed         allmd rss <url>
`;

export function registerExamplesCommand(program: Command): void {
  program
    .command("examples")
    .description("Show usage examples and common workflows")
    .action(() => {
      console.log(EXAMPLES);
    });
}
