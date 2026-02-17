export interface ConversionResult {
  markdown: string;
  metadata: Record<string, unknown>;
  rawContent?: string;
  title: string;
}

export interface ConversionOptions {
  frontmatter?: boolean;
  output?: string;
  verbose?: boolean;
}
