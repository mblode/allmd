import { basePath } from "./config";

const DOCS_ORIGIN = "https://allmd.blode.md";

/** Where the docs are published, from a reader's point of view. */
const PUBLIC_DOCS_PATH = `${basePath}/docs`;

/**
 * The docs origin emits root-relative asset URLs. Those resolve against
 * blode.co, which fronts many projects and has no route for them, so every
 * stylesheet and script 404s and comes back as the HTML 404 page, which the
 * browser then refuses to execute for having the wrong MIME type.
 *
 * Serving the docs through a handler lets us repoint those URLs at a path
 * blode.co already forwards to us, and map them back on the way out. A plain
 * rewrite cannot do this: it has no access to the response body.
 *
 * The upstream segment is the platform's Next.js `assetPrefix`, so it tracks
 * blode.md rather than anything in this repo. It moved from `/_next` to
 * `/_docs` silently, and every docs page lost its CSS and JS until this caught
 * up. If the docs render unstyled again, check what the upstream HTML actually
 * asks for before looking anywhere else.
 *
 * The public segment is ours to name, and deliberately is not `_docs`. Chunk
 * URLs are cached `immutable` for a year, so a bad response pinned against one
 * outlives the deploy that fixed it and survives a cache purge; renaming the
 * segment is the only way to retire a poisoned key. Rename it again if that
 * ever happens.
 */
const UPSTREAM_ASSET_SEGMENT = "_docs";
const PUBLIC_ASSET_SEGMENT = "_chunks";
const UPSTREAM_ASSET_PREFIX = `/${UPSTREAM_ASSET_SEGMENT}/`;
const PUBLIC_ASSET_PREFIX = `${PUBLIC_DOCS_PATH}/${PUBLIC_ASSET_SEGMENT}/`;

const isAssetSlug = (slug: string[]): boolean =>
  slug[0] === PUBLIC_ASSET_SEGMENT;

/** Map a public path onto the path the docs origin actually serves. */
export const toUpstreamPath = (slug: string[]): string => {
  if (isAssetSlug(slug)) {
    return `${UPSTREAM_ASSET_PREFIX}${slug.slice(1).join("/")}`;
  }
  return slug.length ? `/docs/${slug.join("/")}` : "/docs";
};

const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "if-modified-since",
  "if-none-match",
  "range",
  "user-agent",
];

const getForwardHeaders = (request: Request): Headers => {
  const headers = new Headers();
  for (const header of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(header);
    if (value) {
      headers.set(header, value);
    }
  }
  return headers;
};

/**
 * `fetch` transparently decompresses the body, so the upstream
 * content-encoding describes bytes we are no longer sending; forwarding it
 * makes the browser fail to decode an otherwise healthy 200. The upstream Link
 * header advertises preloads at un-prefixed `/_next/...` paths that do not
 * exist here. Neither survives the hop.
 *
 * A HEAD carries the upstream's headers with no body, and those headers say
 * `immutable, max-age=31536000` for a chunk. The edge stores that against a key
 * a GET also reads, so one HEAD -- a curl -I, a link checker, an uptime probe --
 * pins an empty 200 in front of a real stylesheet for a year, and the page
 * renders unstyled with `MIME type ('')` in the console. Only a response that
 * actually carries the bytes is allowed to be stored.
 */
const normaliseHeaders = (
  source: Headers,
  ok: boolean,
  cacheable: boolean
): Headers => {
  const headers = new Headers(source);
  for (const header of ["content-encoding", "content-length", "link"]) {
    headers.delete(header);
  }
  if (!(ok && cacheable)) {
    // Never let a transient upstream failure get pinned at the edge.
    for (const header of ["cdn-cache-control", "vercel-cdn-cache-control"]) {
      headers.delete(header);
    }
    headers.set("cache-control", "no-store");
  }
  return headers;
};

const ASSET_URL_PATTERN = new RegExp(`(["'(])${UPSTREAM_ASSET_PREFIX}`, "g");

/**
 * The upstream `<head>` points its metadata at root-absolute paths. Assets are
 * handled above; these are the rest, and they escape the zone the same way.
 * They resolve against blode.co, which answers 200 with the root site's own
 * files, so an allmd docs page advertises the personal site's llms.txt,
 * manifest and icons. Nothing 404s, which is why no crawler flags it, and
 * llms.txt is the worst of them: an agent told to read the documentation index
 * for these docs is handed a different site's index instead.
 *
 * The two llms files are docs content, so they come from the docs path, where
 * the platform already publishes its own. The manifest and icons are site
 * chrome, and this zone serves its own from `apps/web/app`, so they come from
 * the zone root. Nothing here points at a docs path that does not exist:
 * `/docs/manifest.json` upstream is a 404, which would be worse than the
 * wrong-content 200 it replaced. Note `${basePath}/llms.txt` is a 200 as well,
 * but it is the marketing index rather than the docs index, so it is the wrong
 * target for a docs page.
 */
const ROOT_URL_REWRITES: readonly (readonly [string, string])[] = [
  ["/llms.txt", `${PUBLIC_DOCS_PATH}/llms.txt`],
  ["/llms-full.txt", `${PUBLIC_DOCS_PATH}/llms-full.txt`],
  ["/manifest.json", `${basePath}/manifest.json`],
  // The left column is whatever the platform's `<head>` emits, not what this
  // zone serves, so it keeps naming three icons after this app collapsed down
  // to two. Renaming ours does not rename theirs; drop a source and it escapes
  // to blode.co again.
  ["/favicon.ico", `${basePath}/icon.svg`],
  ["/icon0.svg", `${basePath}/icon.svg`],
  ["/icon1.png", `${basePath}/apple-icon.png`],
  ["/apple-icon.png", `${basePath}/apple-icon.png`],
];

/**
 * Each path is matched only where a URL can start, the same guard the asset
 * rewrite uses. That quote class also covers the escaped `\"` form, so the
 * copies carried in the flight payload are rewritten alongside the rendered
 * `<head>`. Miss those and a client-side navigation restores the old metadata.
 */
const ROOT_URL_PATTERNS = ROOT_URL_REWRITES.map(
  ([from, to]) =>
    [
      new RegExp(`(["'(])${from.replaceAll(".", "\\.")}`, "g"),
      `$1${to}`,
    ] as const
);

const rewriteRootUrls = (html: string): string => {
  let result = html;
  for (const [pattern, replacement] of ROOT_URL_PATTERNS) {
    result = result.replaceAll(pattern, replacement);
  }
  return result;
};

export const rewriteDocsHtml = (html: string): string =>
  rewriteRootUrls(
    html
      .replaceAll(ASSET_URL_PATTERN, `$1${PUBLIC_ASSET_PREFIX}`)
      // Absolute self-references, so nothing points readers back at the origin.
      .replaceAll(`${DOCS_ORIGIN}/docs`, `https://blode.co${PUBLIC_DOCS_PATH}`)
      .replaceAll(DOCS_ORIGIN, `https://blode.co${PUBLIC_DOCS_PATH}`)
  );

const rewriteLocation = (location: string): string => {
  if (location.startsWith(`${DOCS_ORIGIN}/docs`)) {
    return `https://blode.co${PUBLIC_DOCS_PATH}${location.slice(`${DOCS_ORIGIN}/docs`.length)}`;
  }
  if (location.startsWith("/docs")) {
    return `${PUBLIC_DOCS_PATH}${location.slice("/docs".length)}`;
  }
  return location;
};

export const proxyDocsRequest = async (
  request: Request,
  slug: string[]
): Promise<Response> => {
  const { search } = new URL(request.url);
  const upstream = new URL(`${toUpstreamPath(slug)}${search}`, DOCS_ORIGIN);

  const response = await fetch(upstream, {
    headers: getForwardHeaders(request),
    method: request.method,
    redirect: "manual",
  });

  const headers = normaliseHeaders(
    response.headers,
    response.ok,
    request.method === "GET"
  );

  const location = response.headers.get("location");
  if (location) {
    headers.set("location", rewriteLocation(location));
    return new Response(null, {
      headers,
      status: response.status,
      statusText: response.statusText,
    });
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("text/html")
    ? rewriteDocsHtml(await response.text())
    : response.body;

  return new Response(body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
};
