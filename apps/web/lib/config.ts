export const basePath = "/allmd";

export const asset = (path: string) => `${basePath}${path}`;

export const siteUrl = `https://blode.co${basePath}`;

export const siteConfig = {
  description:
    "Turn anything into context your agent can read. A talk, a post, a PDF, a recording. Twelve source types, one command, markdown out.",
  links: {
    author: "https://blode.co",
    docs: "https://allmd.blode.md/docs",
    github: "https://github.com/mblode/allmd",
    npm: "https://www.npmjs.com/package/allmd",
  },
  name: "allmd",
  url: siteUrl,
};
