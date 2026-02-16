export interface ConversionResult {
  title: string;
  markdown: string;
  rawContent?: string;
  metadata: Record<string, unknown>;
}

export interface ConversionOptions {
  ai: boolean;
  output?: string;
}
