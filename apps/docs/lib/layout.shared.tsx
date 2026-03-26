import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const baseOptions = (): BaseLayoutProps => ({
  githubUrl: "https://github.com/mblode/allmd",
  links: [
    {
      text: "Website",
      url: "https://allmd.blode.co",
    },
  ],
  nav: {
    title: "allmd",
  },
});
