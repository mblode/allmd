import { basename, extname } from "node:path";

export function titleFromFilename(filename: string): string {
  return basename(filename, extname(filename));
}

export function slugify(text: string, maxLength = 80): string {
  let slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    const lastHyphen = slug.lastIndexOf("-");
    if (lastHyphen > 0) {
      slug = slug.substring(0, lastHyphen);
    }
  }

  return slug || "untitled";
}
