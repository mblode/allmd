import matter from "gray-matter";
import type { ConversionOptions } from "../types.js";

export interface FrontmatterData {
  date: string;
  source: string;
  title: string;
  type:
    | "youtube"
    | "web"
    | "video"
    | "image"
    | "gdoc"
    | "pdf"
    | "docx"
    | "epub"
    | "csv"
    | "pptx"
    | "tweet"
    | "rss";
  [key: string]: unknown;
}

export function addFrontmatter(content: string, data: FrontmatterData): string {
  return matter.stringify(content, data);
}

export function parseFrontmatter(input: string) {
  return matter(input);
}

export function applyFrontmatter(
  markdown: string,
  options: ConversionOptions,
  data: Omit<FrontmatterData, "date">
): string {
  if (options.frontmatter === false) {
    return markdown;
  }
  return addFrontmatter(markdown, {
    ...data,
    date: new Date().toISOString(),
  } as FrontmatterData);
}
