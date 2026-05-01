import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config";

const staticRoutes = [""];
const TRAILING_SLASH_REGEX = /\/$/;

const getChangeFrequency = (route: string) =>
  route === "" ? "weekly" : "monthly";

const getPriority = (route: string) => {
  if (route === "") {
    return 1;
  }
  return 0.6;
};

const sitemap = (): MetadataRoute.Sitemap => {
  const lastModified = new Date();

  return staticRoutes.map((route) => ({
    changeFrequency: getChangeFrequency(route),
    lastModified,
    priority: getPriority(route),
    url: `${siteConfig.url}/${route}`.replace(TRAILING_SLASH_REGEX, ""),
  }));
};

export default sitemap;
