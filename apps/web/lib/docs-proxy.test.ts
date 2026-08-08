import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "vitest";

import { rewriteDocsHtml, toUpstreamPath } from "./docs-proxy";

/**
 * `docs-proxy.fixture.html` is a snapshot of https://allmd.blode.md/docs taken
 * on 2026-07-29, not a live fetch, so this runs offline and deterministically.
 *
 * Know what that buys and what it does not. It catches us breaking the rewrite.
 * It cannot catch the platform renaming its asset prefix again, which is the
 * thing that broke these docs twice: the snapshot keeps the old shape and keeps
 * passing while production breaks. Refresh the fixture when the docs origin
 * changes, and run the live check below after any blode.md platform change:
 *
 *   DOCS_PROXY_LIVE=1 npm run test --workspace @allmd/web
 */
const FIXTURE = readFileSync(
  path.join(import.meta.dirname, "docs-proxy.fixture.html"),
  "utf-8"
);

/** Root-absolute `href`/`src` values, including the escaped flight-payload form. */
const rootAbsoluteUrls = (html: string): string[] =>
  [...html.matchAll(/(?:href|src)=\\?"(\/[^/"\\][^"\\]*)/gu)].map((m) => m[1]);

const assertNothingEscapesTheZone = (html: string) => {
  const out = rewriteDocsHtml(html);
  const escaping = rootAbsoluteUrls(out).filter(
    (url) => !url.startsWith("/allmd")
  );
  expect(escaping).toEqual([]);
  return out;
};

test("no root-absolute URL survives the rewrite outside the zone", () => {
  assertNothingEscapesTheZone(FIXTURE);
});

/**
 * The blunt assertion above passes for any `/allmd` prefix, so it would not
 * notice the docs head being repointed at another valid-but-wrong URL. Both
 * bugs did exactly that: they sent a docs page to the ROOT site's llms.txt,
 * which answers 200. `/allmd/llms.txt` is a 200 as well and is just as wrong,
 * because it is the marketing index rather than the docs index.
 */
test("the llms files point at the docs index, not the marketing one", () => {
  const out = rewriteDocsHtml(FIXTURE);

  for (const name of ["llms.txt", "llms-full.txt"]) {
    expect(out).toContain(`href="/allmd/docs/${name}"`);
    expect(out).not.toContain(`href="/${name}"`);
    expect(out).not.toContain(`href="/allmd/${name}"`);
    // The copy React carries in the flight payload has to move as well, or a
    // client-side navigation restores the old metadata.
    expect(out).toContain(`\\"href\\":\\"/allmd/docs/${name}`);
    expect(out).not.toContain(`\\"href\\":\\"/${name}`);
  }
});

/**
 * The public asset segment and the upstream one are deliberately different
 * names, so the rewrite and the fetch have to agree on the mapping in both
 * directions. Get one side wrong and every chunk 404s while the HTML still
 * looks right.
 */
test("asset URLs round-trip between the public and upstream segments", () => {
  const out = rewriteDocsHtml(FIXTURE);
  const [publicUrl] = rootAbsoluteUrls(out).filter((url) =>
    url.includes("/_chunks/")
  );

  expect(publicUrl).toBeDefined();
  // `_next` must not survive into the public path: Vercel would resolve it
  // against this app's own build output instead of reaching the handler.
  expect(publicUrl).not.toContain("_next");
  expect(publicUrl).toContain("/allmd/docs/_chunks/static/");

  const slug = (publicUrl as string).replace("/allmd/docs/", "").split("/");
  expect(toUpstreamPath(slug)).toBe(`/_docs/_next/${slug.slice(1).join("/")}`);
});

test.runIf(process.env.DOCS_PROXY_LIVE)(
  "the live docs origin still rewrites clean",
  async () => {
    const response = await fetch("https://allmd.blode.md/docs");
    expect(response.ok).toBe(true);
    assertNothingEscapesTheZone(await response.text());
  },
  30_000
);
