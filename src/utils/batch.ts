import { mkdir } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import fg from "fast-glob";
import pLimit from "p-limit";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { writeOutput } from "./output.js";
import { slugify } from "./slug.js";
import { warn } from "./ui.js";

const GLOB_CHARS_RE = /[*?{}[\]]/;

export function isGlobPattern(input: string): boolean {
  return GLOB_CHARS_RE.test(input);
}

export function expandGlob(pattern: string): Promise<string[]> {
  return fg(pattern, { absolute: true, onlyFiles: true });
}

interface BatchOptions {
  copy?: boolean;
  outputDir?: string;
  parallel: number;
}

interface BatchResult {
  failed: number;
  succeeded: number;
  total: number;
}

export async function processBatch(
  files: string[],
  converter: (
    input: string,
    opts: ConversionOptions
  ) => Promise<ConversionResult>,
  conversionOpts: ConversionOptions,
  batchOpts: BatchOptions,
  onProgress?: (completed: number, total: number) => void
): Promise<BatchResult> {
  const limit = pLimit(batchOpts.parallel);
  let succeeded = 0;
  let failed = 0;
  const total = files.length;

  if (batchOpts.outputDir) {
    const dir = resolve(batchOpts.outputDir);
    await mkdir(dir, { recursive: true });
  }

  const tasks = files.map((file) =>
    limit(async () => {
      try {
        const result = await converter(file, conversionOpts);
        const outputPath = batchOpts.outputDir
          ? join(
              resolve(batchOpts.outputDir),
              `${slugify(result.title || basename(file, extname(file)))}.md`
            )
          : undefined;

        await writeOutput(result.markdown, {
          output: outputPath ?? conversionOpts.output,
          copy: batchOpts.copy,
        });
        succeeded++;
      } catch (err) {
        failed++;
        warn(
          `Failed: ${file} - ${err instanceof Error ? err.message : String(err)}`
        );
      }
      onProgress?.(succeeded + failed, total);
    })
  );

  await Promise.all(tasks);

  return { succeeded, failed, total };
}
