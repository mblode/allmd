export interface ConversionResult {
  title: string;
  markdown: string;
  rawContent?: string;
  metadata: Record<string, unknown>;
}

export interface ConversionOptions {
  output?: string;
  verbose?: boolean;
}
