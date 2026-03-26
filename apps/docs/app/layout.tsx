import { GoogleAnalytics } from "@next/third-parties/google";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import type React from "react";

import "./global.css";

export const metadata: Metadata = {
  description:
    "Documentation for allmd — a CLI tool that converts web pages, YouTube videos, PDFs, audio, images, and more into markdown.",
  other: {
    "apple-mobile-web-app-title": "AllMD",
  },
  title: {
    default: "allmd docs",
    template: "%s | allmd docs",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootProvider>{children}</RootProvider>
        <GoogleAnalytics gaId="G-7XGBDRVZQR" />
      </body>
    </html>
  );
}
