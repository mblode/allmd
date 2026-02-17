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

declare module "turndown-plugin-gfm" {
  import type TurndownService from "turndown";
  export function gfm(service: TurndownService): void;
  export function tables(service: TurndownService): void;
  export function strikethrough(service: TurndownService): void;
}
