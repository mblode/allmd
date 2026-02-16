import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { slugify } from "./slug.js";

export interface OutputOptions {
  output?: string;
}

export function generateOutputPath(title: string): string {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const slug = slugify(title);
  const dir = process.cwd();
  const baseName = `${date}-${slug}`;

  const candidate = join(dir, `${baseName}.md`);
  if (!existsSync(candidate)) {
    return candidate;
  }

  let counter = 2;
  while (existsSync(join(dir, `${baseName}-${counter}.md`))) {
    counter++;
  }
  return join(dir, `${baseName}-${counter}.md`);
}

export async function writeOutput(
  content: string,
  options: OutputOptions
): Promise<void> {
  if (options.output) {
    const filePath = resolve(options.output);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf-8");
  } else {
    process.stdout.write(content);
  }
}
