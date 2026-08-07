import { GeistMono } from "geist/font/mono";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { JsonLd } from "@/components/shared/json-ld";
import { siteConfig } from "@/lib/config";
import { siteGraph } from "@/lib/schema";

import "./globals.css";

const glide = localFont({
  display: "swap",
  src: [{ path: "../public/glide-variable.woff2" }],
  variable: "--font-glide",
  weight: "400 900",
});

const siteTitle = `${siteConfig.name} | Turn anything into markdown your agent can read`;

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
    "markdown for ai agents",
    "claude code skill",
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
        <JsonLd data={siteGraph} />
        {children}
      </body>
    </html>
  );
}
