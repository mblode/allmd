import { type NextRequest, NextResponse } from "next/server";

const DOCS_ORIGIN = "https://allmd.blode.md";
const CURRENT_DEPLOYMENT_ID = process.env.VERCEL_DEPLOYMENT_ID ?? "";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!(pathname.startsWith("/_next/") && CURRENT_DEPLOYMENT_ID)) {
    return NextResponse.next();
  }

  const dpl = request.nextUrl.searchParams.get("dpl");
  if (dpl && dpl !== CURRENT_DEPLOYMENT_ID) {
    return NextResponse.rewrite(new URL(`${pathname}${search}`, DOCS_ORIGIN));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/_next/static/:path*"],
};
