import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { GlobeIcon } from "lucide-react";

export const baseOptions = (): BaseLayoutProps => ({
  githubUrl: "https://github.com/mblode/allmd",
  links: [
    {
      external: true,
      icon: <GlobeIcon />,
      label: "Website",
      text: "Website",
      type: "icon",
      url: "https://allmd.blode.co",
    },
  ],
  nav: {
    title: "allmd",
  },
});
