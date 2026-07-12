import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

function createTurndown(): TurndownService {
  const td = new TurndownService({
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    headingStyle: "atx",
  });
  td.use(gfm);
  return td;
}

export function htmlToMarkdown(html: string): string {
  return createTurndown().turndown(html);
}
