import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

function createTurndown(): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  td.use(gfm);
  return td;
}

export function htmlToMarkdown(html: string): string {
  return createTurndown().turndown(html);
}
