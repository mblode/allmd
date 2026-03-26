import { GoogleAnalytics } from "@next/third-parties/google";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";

import "./global.css";

export const metadata: Metadata = {
  appleWebApp: {
    title: "allmd",
  },
  description:
    "Documentation for allmd — a CLI tool that converts web pages, YouTube videos, PDFs, audio, images, and more into markdown.",
  title: {
    default: "allmd docs",
    template: "%s | allmd docs",
  },
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
      <GoogleAnalytics gaId="G-SSFCC1ZF38" />
    </html>
  );
}
