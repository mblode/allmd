import { getLLMText, source } from "@/lib/source";

export const revalidate = false;

export const GET = async () => {
  const scanned = await Promise.all(source.getPages().map(getLLMText));

  return new Response(scanned.join("\n\n"));
};
