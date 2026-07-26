export const basePath = "/allmd";

export const asset = (path: string) => `${basePath}${path}`;

export const siteUrl = `https://blode.co${basePath}`;

export const siteConfig = {
  description:
    "Convert anything to markdown with one CLI command. Web pages, YouTube, PDFs, Google Docs, images, audio, Word, EPUB, CSV, PowerPoint, tweets, and RSS feeds.",
  links: {
    author: "https://blode.co",
    docs: "https://allmd.blode.md/docs",
    github: "https://github.com/mblode/allmd",
    npm: "https://www.npmjs.com/package/allmd",
  },
  name: "allmd",
  url: siteUrl,
};
