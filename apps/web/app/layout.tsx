import { GeistMono } from "geist/font/mono";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { JsonLd } from "@/components/shared/json-ld";
import { siteConfig } from "@/lib/config";

import "./globals.css";

const glide = localFont({
  display: "swap",
  src: [{ path: "../public/glide-variable.woff2" }],
  variable: "--font-glide",
  weight: "400 900",
});

const siteTitle = `${siteConfig.name} | Turn the whole universe into markdown`;

export const viewport: Viewport = {
  width: "device-width",
};

export const metadata: Metadata = {
  alternates: {
    canonical: siteConfig.url,
  },
  description: siteConfig.description,
  keywords: [
    "markdown converter",
    "convert to markdown",
    "web to markdown",
    "pdf to markdown",
    "youtube to markdown",
    "cli tool",
    "allmd",
  ],
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    description: siteConfig.description,
    siteName: siteConfig.name,
    title: siteTitle,
    type: "website",
    url: siteConfig.url,
  },
  other: {
    "apple-mobile-web-app-title": siteConfig.name,
    "google-site-verification": "mFwyBIbXTaKK4uF_NA0MzVWFyY40hPgBjFObg3rje04",
  },
  title: siteTitle,
  twitter: {
    card: "summary_large_image",
    description: siteConfig.description,
    title: siteTitle,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  logo: `${siteConfig.url}/icon0.svg`,
  name: siteConfig.name,
  sameAs: [siteConfig.links.github],
  url: siteConfig.url,
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteConfig.url,
};

// Typed as SoftwareSourceCode, not SoftwareApplication. Google's Software App
// rich result requires `offers` plus one of `aggregateRating` or `review`, and
// its review guidelines forbid ratings we author about our own package, so a
// SoftwareApplication node could only ever fail validation.
const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  author: {
    "@type": "Person",
    name: "Matthew Blode",
    url: siteConfig.links.author,
  },
  codeRepository: siteConfig.links.github,
  description: siteConfig.description,
  isAccessibleForFree: true,
  license: "https://opensource.org/licenses/MIT",
  name: siteConfig.name,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  programmingLanguage: "TypeScript",
  runtimePlatform: "Node.js",
  url: siteConfig.links.npm,
  version: process.env.ALLMD_VERSION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${glide.variable} ${GeistMono.variable} min-h-screen font-sans antialiased`}
      lang="en"
    >
      <head>
        <link href={process.env.NEXT_PUBLIC_POSTHOG_HOST} rel="preconnect" />
      </head>
      <body className="flex min-h-screen flex-col">
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={webSiteJsonLd} />
        <JsonLd data={softwareJsonLd} />
        {children}
      </body>
    </html>
  );
}
