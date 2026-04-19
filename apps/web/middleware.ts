import { type NextRequest, NextResponse } from "next/server";

const DOCS_ORIGIN = "https://allmd.blode.md";
const CURRENT_DEPLOYMENT_ID = process.env.VERCEL_DEPLOYMENT_ID ?? "";

// Routes that have a markdown twin served from a sibling .md route handler.
// Keys are the requested pathname; values are the rewrite target.
const MARKDOWN_ROUTES: Record<string, string> = {
  "/": "/home.md",
};

function prefersMarkdown(accept: string | null): boolean {
  if (!accept) {
    return false;
  }
  // Treat any explicit text/markdown mention as opt-in. Browsers send
  // "text/html,..." and never include text/markdown, so this won't trigger
  // for normal page loads.
  return /(^|[\s,])text\/markdown(\s*;|\s*,|\s*$)/i.test(accept);
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Markdown content negotiation for agent clients (RFC 9110 §12.5.1).
  const markdownTarget = MARKDOWN_ROUTES[pathname];
  if (markdownTarget && prefersMarkdown(request.headers.get("accept"))) {
    const url = request.nextUrl.clone();
    url.pathname = markdownTarget;
    const response = NextResponse.rewrite(url);
    response.headers.set("Vary", "Accept");
    return response;
  }

  // Static asset rewrite for stale deployments served from the docs origin.
  if (pathname.startsWith("/_next/") && CURRENT_DEPLOYMENT_ID) {
    const dpl = request.nextUrl.searchParams.get("dpl");
    if (dpl && dpl !== CURRENT_DEPLOYMENT_ID) {
      return NextResponse.rewrite(new URL(`${pathname}${search}`, DOCS_ORIGIN));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/_next/static/:path*"],
};
