import { cosmiconfig } from "cosmiconfig";

export interface AllmdConfig {
  openai?: {
    model?: string;
  };
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
    outputDir: cliOpts.outputDir ?? config.outputDir,
    verbose: cliOpts.verbose ?? config.verbose,
    parallel:
      cliOpts.parallel ??
      (config.parallel != null ? String(config.parallel) : undefined),
    openai: config.openai,
    output: cliOpts.output,
    clipboard: cliOpts.clipboard,
    copy: cliOpts.copy,
  };
}
