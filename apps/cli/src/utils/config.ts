import { cosmiconfig } from "cosmiconfig";

export interface AllmdConfig {
  ai?: boolean;
  frontmatter?: boolean;
  openai?: {
    model?: string;
  };
  output?: string;
  outputDir?: string;
  parallel?: number;
  verbose?: boolean;
}

const explorer = cosmiconfig("allmd");

let cachedConfig: AllmdConfig | null = null;

export async function loadConfig(): Promise<AllmdConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const result = await explorer.search();
    cachedConfig = (result?.config as AllmdConfig) ?? {};
  } catch {
    cachedConfig = {};
  }

  return cachedConfig;
}

export function mergeWithCliOpts(
  cliOpts: Record<string, unknown>,
  config: AllmdConfig
): Record<string, unknown> {
  return {
    ai: cliOpts.ai ?? config.ai,
    clipboard: cliOpts.clipboard,
    copy: cliOpts.copy,
    frontmatter: cliOpts.frontmatter ?? config.frontmatter,
    openai: config.openai,
    output: cliOpts.output ?? config.output,
    outputDir: cliOpts.outputDir ?? config.outputDir,
    parallel:
      cliOpts.parallel ??
      (config.parallel == null ? undefined : String(config.parallel)),
    verbose: cliOpts.verbose ?? config.verbose,
  };
}
