import { readFile } from "node:fs/promises";
import AdmZip from "adm-zip";
import { formatAsMarkdown } from "../ai/client.js";
import type { ConversionOptions, ConversionResult } from "../types.js";
import { applyFrontmatter } from "../utils/frontmatter.js";
import { titleFromFilename } from "../utils/slug.js";
import { verbose } from "../utils/ui.js";

const SLIDE_NUMBER_SUFFIX_RE = /\b\d+\b\s*$/;
const SLIDE_ENTRY_RE = /^ppt\/slides\/slide\d+\.xml$/;
const SLIDE_NUM_RE = /slide(\d+)/;
const NOTES_ENTRY_RE = /^ppt\/notesSlides\/notesSlide(\d+)\.xml$/;

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractTextFromXml(xml: string): string {
  const paragraphs: string[] = [];
  const paragraphMatches = xml.matchAll(/<a:p\b[^>]*>([\s\S]*?)<\/a:p>/g);

  for (const pMatch of paragraphMatches) {
    const paragraphXml = pMatch[1];
    const texts: string[] = [];
    const textMatches = paragraphXml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g);

    for (const tMatch of textMatches) {
      texts.push(decodeXmlEntities(tMatch[1]));
    }

    if (texts.length > 0) {
      paragraphs.push(texts.join(""));
    }
  }

  return paragraphs.join("\n").trim();
}

function extractNotesFromXml(xml: string): string {
  const texts: string[] = [];
  const matches = xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g);
  for (const match of matches) {
    texts.push(decodeXmlEntities(match[1]));
  }
  const fullText = texts.join(" ").trim();
  // Filter out slide number placeholders
  const filtered = fullText.replace(SLIDE_NUMBER_SUFFIX_RE, "").trim();
  return filtered;
}

export async function convertPptx(
  filePath: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  verbose(`Reading PPTX: ${filePath}`, options.verbose);
  const buffer = await readFile(filePath);
  verbose(
    `PPTX size: ${Math.round(buffer.byteLength / 1024)} KB`,
    options.verbose
  );

  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  // Find slide entries sorted by number
  const slideEntries = entries
    .filter((e) => SLIDE_ENTRY_RE.test(e.entryName))
    .sort((a, b) => {
      const numA = Number.parseInt(
        a.entryName.match(SLIDE_NUM_RE)?.[1] ?? "0",
        10
      );
      const numB = Number.parseInt(
        b.entryName.match(SLIDE_NUM_RE)?.[1] ?? "0",
        10
      );
      return numA - numB;
    });

  verbose(`Found ${slideEntries.length} slides`, options.verbose);

  // Build notes map
  const notesMap = new Map<number, string>();
  for (const entry of entries) {
    const notesMatch = entry.entryName.match(NOTES_ENTRY_RE);
    if (notesMatch) {
      const slideNum = Number.parseInt(notesMatch[1], 10);
      const xml = entry.getData().toString("utf-8");
      const notes = extractNotesFromXml(xml);
      if (notes) {
        notesMap.set(slideNum, notes);
      }
    }
  }

  const slideSections: string[] = [];

  for (let i = 0; i < slideEntries.length; i++) {
    const entry = slideEntries[i];
    const slideNum = i + 1;
    const xml = entry.getData().toString("utf-8");
    const text = extractTextFromXml(xml);

    let section = `## Slide ${slideNum}\n\n${text || "(no text content)"}`;

    const fileSlideNum = Number.parseInt(
      entry.entryName.match(SLIDE_NUM_RE)?.[1] ?? "0",
      10
    );
    const notes = notesMap.get(fileSlideNum);
    if (notes) {
      section += `\n\n> Speaker notes: ${notes}`;
    }

    slideSections.push(section);
  }

  const rawMarkdown = slideSections.join("\n\n---\n\n");
  verbose(
    `Extracted ${rawMarkdown.length.toLocaleString()} chars raw markdown`,
    options.verbose
  );

  const markdown = await formatAsMarkdown(
    rawMarkdown,
    {
      title: titleFromFilename(filePath),
      source: filePath,
      type: "PowerPoint presentation",
    },
    options.verbose
  );

  const title = titleFromFilename(filePath);

  const withFrontmatter = applyFrontmatter(markdown, options, {
    title,
    source: filePath,
    type: "pptx",
    slides: slideEntries.length,
  });

  verbose(
    `Final output: ${withFrontmatter.length.toLocaleString()} chars`,
    options.verbose
  );

  return {
    title,
    markdown: withFrontmatter,
    rawContent: rawMarkdown,
    metadata: {
      slides: slideEntries.length,
      hasNotes: notesMap.size > 0,
    },
  };
}
