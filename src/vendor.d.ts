declare module "pdf-parse" {
  interface PdfParseResult {
    info: Record<string, unknown>;
    metadata: unknown;
    numpages: number;
    numrender: number;
    text: string;
    version: string;
  }
  function pdfParse(dataBuffer: Buffer): Promise<PdfParseResult>;
  export default pdfParse;
}

declare module "ffmpeg-extract-audio" {
  interface ExtractAudioOptions {
    format?: string;
    input: string;
    output: string;
  }
  function extractAudio(options: ExtractAudioOptions): Promise<void>;
  export default extractAudio;
}

declare module "mammoth" {
  interface MammothResult {
    messages: Array<{ type: string; message: string }>;
    value: string;
  }
  interface Mammoth {
    convertToHtml(
      input: { buffer: Buffer } | { path: string }
    ): Promise<MammothResult>;
    extractRawText(
      input: { buffer: Buffer } | { path: string }
    ): Promise<MammothResult>;
  }
  const mammoth: Mammoth;
  export default mammoth;
}

declare module "epub2" {
  interface TocElement {
    href?: string;
    id?: string;
    level?: number;
    order?: number;
    title?: string;
  }
  interface EpubMetadata {
    creator?: string;
    date?: string;
    description?: string;
    ISBN?: string;
    language?: string;
    publisher?: string;
    subject?: string[];
    title?: string;
    [key: string]: unknown;
  }
  class EPub {
    metadata: EpubMetadata;
    flow: TocElement[];
    toc: TocElement[];
    spine: { contents: TocElement[] };
    static createAsync(
      epubfile: string,
      imagewebroot?: string,
      chapterwebroot?: string
    ): Promise<EPub>;
    getChapterAsync(chapterId: string): Promise<string>;
    getChapterRawAsync(chapterId: string): Promise<string>;
    getImageAsync(id: string): Promise<[Buffer, string]>;
  }
  export default EPub;
}

declare module "rss-parser" {
  interface RssItem {
    categories?: string[];
    content?: string;
    contentSnippet?: string;
    creator?: string;
    guid?: string;
    isoDate?: string;
    link?: string;
    pubDate?: string;
    summary?: string;
    title?: string;
  }
  interface RssFeed {
    description?: string;
    feedUrl?: string;
    items: RssItem[];
    link?: string;
    title?: string;
  }
  class RssParser {
    parseURL(url: string): Promise<RssFeed>;
    parseString(xml: string): Promise<RssFeed>;
  }
  export default RssParser;
}

declare module "update-notifier" {
  interface Package {
    name: string;
    version: string;
  }
  interface UpdateInfo {
    current: string;
    latest: string;
    name: string;
    type: "latest" | "major" | "minor" | "patch" | "prerelease" | "build";
  }
  interface NotifierOptions {
    pkg: Package;
    updateCheckInterval?: number;
  }
  interface Notifier {
    check(): void;
    notify(options?: { message?: string; defer?: boolean }): void;
    update?: UpdateInfo;
  }
  function updateNotifier(options: NotifierOptions): Notifier;
  export default updateNotifier;
}

declare module "tabtab" {
  interface TabtabEnv {
    complete: boolean;
    last: string;
    lastPartial: string;
    line: string;
    partial: string;
    point: number;
    prev: string;
    words: number;
  }
  interface CompletionItem {
    description?: string;
    name: string;
  }
  function install(options: { name: string; completer: string }): Promise<void>;
  function uninstall(options: { name: string }): Promise<void>;
  function parseEnv(env: NodeJS.ProcessEnv): TabtabEnv;
  function log(items: (string | CompletionItem)[]): void;
  function isComplete(): boolean;
}

declare module "turndown-plugin-gfm" {
  import type TurndownService from "turndown";
  export function gfm(service: TurndownService): void;
  export function tables(service: TurndownService): void;
  export function strikethrough(service: TurndownService): void;
}
