import { siteConfig } from "@/lib/config";

const body = `# Content-Signal directives declare AI usage preferences (https://contentsignals.org/).
# search: allow indexing for traditional search engines.
# ai-input: allow grounding/RAG for AI assistant answers (with citation).
# ai-train: disallow use of this content to train AI models.
Content-Signal: search=yes, ai-input=yes, ai-train=no

User-agent: *
Allow: /

Sitemap: ${siteConfig.url}/sitemap.xml
`;

export const dynamic = "force-static";

export function GET(): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
