import matter from "gray-matter";

export interface FrontmatterData {
  title: string;
  source: string;
  date: string;
  type: "youtube" | "web" | "video" | "image" | "gdoc" | "pdf";
  [key: string]: unknown;
}

export function addFrontmatter(content: string, data: FrontmatterData): string {
  return matter.stringify(content, data);
}

export function parseFrontmatter(input: string) {
  return matter(input);
}
