export interface ConversionResult {
  markdown: string;
  metadata: Record<string, unknown>;
  rawContent?: string;
  title: string;
}

export interface ConversionOptions {
  diarize?: boolean;
  frontmatter?: boolean;
  output?: string;
  speakerReferences?: string[];
  speakers?: string[];
  verbose?: boolean;
}
