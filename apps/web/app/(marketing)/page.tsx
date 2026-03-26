"use client";

import {
  ArrowRightIcon,
  ConsoleIcon,
  FileDownloadIcon,
  FileTextIcon,
  GlobusIcon,
  LayoutGrid1Icon,
  MagicWandIcon,
  SparkleIcon,
} from "blode-icons-react";
import { SplitText } from "griffo/motion";
import { stagger } from "motion";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";

const features = [
  {
    description:
      "Pass any URL or file. allmd identifies the content type and routes to the right converter automatically.",
    icon: SparkleIcon,
    title: "Auto-detect",
  },
  {
    description:
      "Raw content is restructured by AI into clean, well-organized markdown. Every word preserved, nothing summarized.",
    icon: MagicWandIcon,
    title: "AI formatting",
  },
  {
    description:
      "Web, YouTube, PDF, Google Docs, video, audio, images, Word, EPUB, CSV, PowerPoint, tweets, and RSS.",
    icon: LayoutGrid1Icon,
    title: "12 converters",
  },
  {
    description:
      "Write to a file, a directory, stdout, or your clipboard. Batch convert with glob patterns.",
    icon: ArrowRightIcon,
    title: "Output anywhere",
  },
  {
    description:
      "Every conversion includes YAML frontmatter with title, source, date, and format-specific fields.",
    icon: FileTextIcon,
    title: "Rich frontmatter",
  },
  {
    description:
      "Install as a skill for Claude Code, Cursor, or any AI coding assistant.",
    icon: ConsoleIcon,
    title: "Agent skill",
  },
];

export default function HomePage(): React.JSX.Element {
  return (
    <div>
      {/* Hero */}
      <section className="@container py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <SplitText
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            as="h1"
            className="text-balance text-4xl font-medium tracking-tight leading-[1.2] sm:text-5xl sm:tracking-[-0.03em] sm:leading-[1.15]"
            initial={{ filter: "blur(8px)", opacity: 0, y: 20 }}
            options={{ type: "words" }}
            transition={{
              delay: stagger(0.04),
              duration: 0.65,
              ease: [0.25, 1, 0.5, 1],
            }}
          >
            <p>Turn the whole universe into markdown.</p>
          </SplitText>
          <motion.p
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            className="mx-auto mt-4 max-w-[60ch] text-lg text-muted-foreground leading-relaxed"
            initial={{ filter: "blur(8px)", opacity: 0, y: 8 }}
            transition={{
              delay: 0.35,
              duration: 0.65,
              ease: [0.25, 1, 0.5, 1],
            }}
          >
            Web pages, YouTube videos, PDFs, audio, images, and 7 more formats.
            One command, clean markdown out.
          </motion.p>
          <motion.div
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
            initial={{ filter: "blur(8px)", opacity: 0, y: 4 }}
            transition={{
              delay: 0.5,
              duration: 0.65,
              ease: [0.25, 1, 0.5, 1],
            }}
          >
            <Button
              render={
                <a
                  href={siteConfig.links.npm}
                  rel="noopener noreferrer"
                  target="_blank"
                />
              }
              size="lg"
            >
              <FileDownloadIcon data-icon="inline-start" />
              npm install -g allmd
            </Button>
            <Button
              render={
                <a
                  href={siteConfig.links.github}
                  rel="noopener noreferrer"
                  target="_blank"
                />
              }
              size="lg"
              variant="secondary"
            >
              <GlobusIcon data-icon="inline-start" />
              View on GitHub
            </Button>
          </motion.div>
          <motion.code
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            className="relative mt-8 inline-flex cursor-pointer items-center gap-2 font-mono text-sm text-muted-foreground transition-colors hover:text-foreground"
            initial={{ filter: "blur(8px)", opacity: 0, y: 4 }}
            onClick={() => {
              void navigator.clipboard.writeText(
                "allmd https://example.com -o article.md"
              );
            }}
            transition={{
              delay: 0.65,
              duration: 0.65,
              ease: [0.25, 1, 0.5, 1],
            }}
          >
            $ allmd https://example.com -o article.md
          </motion.code>
        </div>
      </section>

      {/* Features */}
      <section className="@container pt-8 pb-16 sm:pt-16 sm:pb-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-balance text-3xl font-medium tracking-tight leading-[1.15]">
            Why allmd
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 text-sm @sm:grid-cols-2 @xl:grid-cols-3">
            {features.map((feature) => (
              <div
                className="feature-card space-y-3 border-t pt-6"
                key={feature.title}
              >
                <feature.icon className="size-4 text-muted-foreground" />
                <p className="text-muted-foreground leading-5">
                  <span className="font-medium text-foreground">
                    {feature.title}
                  </span>{" "}
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLI */}
      <section className="@container py-16 sm:py-24" id="cli">
        <div className="mx-auto grid max-w-3xl gap-6 px-6 @2xl:grid-cols-2 @2xl:gap-12">
          <div className="space-y-4">
            <h2 className="text-balance text-3xl font-medium tracking-tight leading-[1.15]">
              One command
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Pass any URL or file. allmd auto-detects the type and converts it
              to clean, structured markdown.
            </p>
            <Button
              render={
                <a
                  href={siteConfig.links.npm}
                  rel="noopener noreferrer"
                  target="_blank"
                />
              }
            >
              View on npm
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 text-sm @sm:grid-cols-2 @2xl:grid-cols-1">
            <div className="feature-card space-y-3 border-t pt-6">
              <SparkleIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">Auto-detect</span>
              </p>
              <code className="block font-mono text-xs text-muted-foreground">
                allmd https://example.com
              </code>
            </div>
            <div className="feature-card space-y-3 border-t pt-6">
              <ConsoleIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">
                  Or be explicit
                </span>
              </p>
              <code className="block font-mono text-xs text-muted-foreground">
                allmd youtube https://youtu.be/dQw4w9WgXcQ -o transcript.md
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* API */}
      <section className="@container py-16 sm:py-24" id="api">
        <div className="mx-auto grid max-w-3xl gap-6 px-6 @2xl:grid-cols-2 @2xl:gap-12">
          <div className="space-y-4">
            <h2 className="text-balance text-3xl font-medium tracking-tight leading-[1.15]">
              Programmatic API
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Import any converter directly. Use allmd as a library in your
              Node.js projects with full TypeScript support.
            </p>
            <Button
              render={
                <a
                  href={`${siteConfig.links.github}#api-usage`}
                  rel="noopener noreferrer"
                  target="_blank"
                />
              }
            >
              View docs
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 text-sm @sm:grid-cols-2 @2xl:grid-cols-1">
            <div className="feature-card space-y-3 border-t pt-6">
              <MagicWandIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">
                  Import and convert
                </span>
              </p>
              <code className="block font-mono text-xs text-muted-foreground">
                {`import { convertWeb } from "allmd";`}
              </code>
            </div>
            <div className="feature-card space-y-3 border-t pt-6">
              <FileTextIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">
                  Get structured results
                </span>
              </p>
              <code className="block font-mono text-xs text-muted-foreground">
                {`const result = await convertPdf("report.pdf");`}
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Agent skill */}
      <section className="@container py-16 sm:py-24" id="skills">
        <div className="mx-auto grid max-w-3xl gap-6 px-6 @2xl:grid-cols-2 @2xl:gap-12">
          <div className="space-y-4">
            <h2 className="text-balance text-3xl font-medium tracking-tight leading-[1.15]">
              Agent skill
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              One command to give your AI coding agent the ability to convert
              anything to markdown.
            </p>
            <Button
              render={
                <a
                  href={siteConfig.links.docs}
                  rel="noopener noreferrer"
                  target="_blank"
                />
              }
            >
              View docs
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 text-sm @sm:grid-cols-2 @2xl:grid-cols-1">
            <div className="feature-card space-y-3 border-t pt-6">
              <FileDownloadIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">
                  Install the skill
                </span>
              </p>
              <code className="block font-mono text-xs text-muted-foreground">
                npx skills add mblode/allmd
              </code>
            </div>
            <div className="feature-card space-y-3 border-t pt-6">
              <SparkleIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">
                  Convert anything
                </span>
              </p>
              <code className="block font-mono text-xs text-muted-foreground">
                allmd https://docs.google.com/document/d/...
              </code>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
