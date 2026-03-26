export interface ConversionResult {
  markdown: string;
  metadata: Record<string, unknown>;
  rawContent?: string;
  title: string;
}

export interface ConversionOptions {
  abortSignal?: AbortSignal;
  diarize?: boolean;
  frontmatter?: boolean;
  onProgress?: (message: string) => void;
  output?: string;
  speakerReferences?: string[];
  speakers?: string[];
  verbose?: boolean;
}
