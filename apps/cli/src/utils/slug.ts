import { basename, extname } from "node:path";

export function titleFromFilename(filename: string): string {
  return basename(filename, extname(filename));
}

export function slugify(text: string, maxLength = 80): string {
  let slug = text
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "");

  if (slug.length > maxLength) {
    slug = slug.slice(0, maxLength);
    const lastHyphen = slug.lastIndexOf("-");
    if (lastHyphen > 0) {
      slug = slug.slice(0, lastHyphen);
    }
  }

  return slug || "untitled";
}
