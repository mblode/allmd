import { readFileSync } from "node:fs";

let version = "0.0.0";
try {
  ({ version } = JSON.parse(
    readFileSync(new URL("../cli/package.json", import.meta.url), "utf8")
  ));
} catch {
  // CLI package unavailable in standalone Vercel deployments
}

const isDev = process.env.NODE_ENV === "development";

// Vercel Analytics and Speed Insights load first-party on Vercel (covered by
// 'self'); only local dev pulls their scripts/beacons from external Vercel hosts.
const devAnalyticsScriptSrc = isDev ? " https://va.vercel-scripts.com" : "";
const devAnalyticsConnectSrc = isDev
  ? " https://vitals.vercel-insights.com"
  : "";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com${devAnalyticsScriptSrc}`,
  `connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com${devAnalyticsConnectSrc}`,
  "img-src 'self' data: https://www.google-analytics.com https://matthewblode.com",
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
    // All matching rules apply in array order and later values win per header
    // key, so the catch-all must come first and per-route overrides after it.
    return [
      {
        headers: securityHeaders,
        source: "/(.*)",
      },
      // Dynamic OG image from app/opengraph-image.tsx (also serves as the
      // Twitter image). Cover both path forms Next may emit for the route.
      {
        headers: [
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
        source: "/opengraph-image",
      },
      {
        headers: [
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
        source: "/opengraph-image.png",
      },
      {
        headers: [
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
    ];
  },
};

export default nextConfig;
