import { readFileSync } from "node:fs";

let version = "0.0.0";
try {
  ({ version } = JSON.parse(
    readFileSync(new URL("../cli/package.json", import.meta.url), "utf8")
  ));
} catch {
  // CLI package unavailable in standalone Vercel deployments
}

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com`,
  "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com",
  "img-src 'self' data: https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

// RFC 8288 Link headers advertising agent-discoverable resources.
const homepageLinkHeader = [
  '</.well-known/agent-skills/index.json>; rel="agent-skills"; type="application/json"',
  '</docs>; rel="service-doc"',
  '</>; rel="alternate"; type="text/markdown"',
  '<https://github.com/mblode/allmd>; rel="vcs-github"',
].join(", ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    ALLMD_VERSION: version,
  },
  reactCompiler: true,
  rewrites() {
    return {
      beforeFiles: [
        {
          source: "/docs",
          destination: "https://allmd.blode.md/docs",
        },
        {
          source: "/docs/:path*",
          destination: "https://allmd.blode.md/docs/:path*",
        },
      ],
    };
  },
  headers() {
    return [
      {
        headers: [
          ...securityHeaders.filter(
            (h) => h.key !== "Cross-Origin-Resource-Policy"
          ),
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
        source: "/opengraph-image.png",
      },
      {
        headers: [
          ...securityHeaders.filter(
            (h) => h.key !== "Cross-Origin-Resource-Policy"
          ),
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
        source: "/twitter-image.png",
      },
      {
        headers: [
          ...securityHeaders.filter(
            (h) => h.key !== "Cross-Origin-Resource-Policy"
          ),
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
        source: "/web-app-manifest-:size.png",
      },
      {
        headers: [
          { key: "Link", value: homepageLinkHeader },
          { key: "Vary", value: "Accept" },
        ],
        source: "/",
      },
      {
        headers: securityHeaders,
        source: "/(.*)",
      },
    ];
  },
};

export default nextConfig;
