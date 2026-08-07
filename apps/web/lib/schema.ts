import { siteConfig } from "@/lib/config";

/**
 * Stable `@id` anchors, so this zone's nodes resolve into one graph instead of
 * several disconnected snippets.
 *
 * The Person, Organization and WebSite ids belong to blode.co and are only ever
 * referenced, never redefined here. blode.co/allmd is a path on blode.co behind
 * a rewrite, not a site of its own: redefining them would publish a second
 * Matthew Blode and a second website on one domain. Contract:
 * blode-co/apps/web/.claude/knowledge/zone-conventions.md
 */
const host = "https://blode.co";

export const schemaId = {
  breadcrumb: `${siteConfig.url}/#breadcrumb`,
  organization: `${host}/#organization`,
  person: `${host}/#person`,
  software: `${siteConfig.url}/#software`,
  webPage: `${siteConfig.url}/#webpage`,
  website: `${host}/#website`,
} as const;

export const siteGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@id": schemaId.webPage,
      "@type": "WebPage",
      about: { "@id": schemaId.software },
      breadcrumb: { "@id": schemaId.breadcrumb },
      description: siteConfig.description,
      inLanguage: "en-US",
      isPartOf: { "@id": schemaId.website },
      name: siteConfig.name,
      url: siteConfig.url,
    },
    // Typed as SoftwareSourceCode, not SoftwareApplication. Google's Software
    // App rich result requires `offers` plus one of `aggregateRating` or
    // `review`, and its review guidelines forbid ratings we author about our own
    // package, so a SoftwareApplication node could only ever fail validation.
    {
      "@id": schemaId.software,
      "@type": "SoftwareSourceCode",
      author: { "@id": schemaId.person },
      codeRepository: siteConfig.links.github,
      description: siteConfig.description,
      isAccessibleForFree: true,
      isPartOf: { "@id": schemaId.website },
      license: "https://opensource.org/licenses/MIT",
      name: siteConfig.name,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      programmingLanguage: "TypeScript",
      publisher: { "@id": schemaId.organization },
      runtimePlatform: "Node.js",
      url: siteConfig.links.npm,
      version: process.env.ALLMD_VERSION,
    },
    {
      "@id": schemaId.breadcrumb,
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", item: `${host}/`, name: "Home", position: 1 },
        {
          "@type": "ListItem",
          item: `${host}/projects`,
          name: "Projects",
          position: 2,
        },
        {
          "@type": "ListItem",
          item: siteConfig.url,
          name: siteConfig.name,
          position: 3,
        },
      ],
    },
  ],
};
