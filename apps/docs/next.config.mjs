import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  allowedDevOrigins: ["docs.allmd.localhost"],
  basePath: "/docs",
  reactStrictMode: true,
  rewrites() {
    return [
      {
        destination: "/llms.mdx/:path*",
        source: "/:path*.mdx",
      },
    ];
  },
};

export default withMDX(config);
