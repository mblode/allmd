import matter from "gray-matter";

export interface FrontmatterData {
  date: string;
  source: string;
  title: string;
  type: "youtube" | "web" | "video" | "image" | "gdoc" | "pdf";
  [key: string]: unknown;
}

export function addFrontmatter(content: string, data: FrontmatterData): string {
  return matter.stringify(content, data);
}

export function parseFrontmatter(input: string) {
  return matter(input);
}
