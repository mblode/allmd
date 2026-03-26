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
import { CopyButton } from "@/components/ui/copy-button";
import { siteConfig } from "@/lib/config";

const features = [
  {
    description: "Pass any URL or file path. allmd figures out the type.",
    icon: SparkleIcon,
    title: "Auto-detect",
  },
  {
    description:
      "AI cleans up the output into consistent, readable markdown.",
    icon: MagicWandIcon,
    title: "AI formatting",
  },
  {
    description:
      "Web, YouTube, PDF, Google Docs, video, audio, images, Word, EPUB, CSV, PowerPoint, tweets, RSS.",
    icon: LayoutGrid1Icon,
    title: "12 formats",
  },
  {
    description: "Write to file, directory, clipboard, or stdout.",
    icon: ArrowRightIcon,
    title: "Flexible output",
  },
  {
    description:
      "Every file gets a YAML header with title, source, date, and more.",
    icon: FileTextIcon,
    title: "Frontmatter",
  },
  {
    description:
      "Works with Claude Code, Cursor, and other AI coding agents.",
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
            Convert anything to markdown. Web pages, YouTube, PDFs, images,
            audio, and more.
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
                  href={`${siteConfig.links.docs}`}
                  rel="noopener noreferrer"
                  target="_blank"
                />
              }
              size="lg"
            >
              Get started
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
              GitHub
            </Button>
          </motion.div>
          <motion.code
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            className="relative mt-8 inline-flex items-center gap-2 font-mono text-sm text-muted-foreground"
            initial={{ filter: "blur(8px)", opacity: 0, y: 4 }}
            transition={{
              delay: 0.65,
              duration: 0.65,
              ease: [0.25, 1, 0.5, 1],
            }}
          >
            <span>npx skills add mblode/allmd</span>
            <CopyButton content="npx skills add mblode/allmd" />
          </motion.code>
        </div>
      </section>

      {/* Features */}
      <section className="@container pt-8 pb-16 sm:pt-16 sm:pb-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-balance text-3xl font-medium tracking-tight leading-[1.15]">
            Features
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

      {/* Install */}
      <section className="@container py-16 sm:py-24" id="install">
        <div className="mx-auto grid max-w-3xl gap-6 px-6 @2xl:grid-cols-2 @2xl:gap-12">
          <div className="space-y-4">
            <h2 className="text-balance text-3xl font-medium tracking-tight leading-[1.15]">
              Install
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              One command to set up, one command to convert.
            </p>
            <Button
              render={
                <a
                  href={`${siteConfig.links.docs}/installation`}
                  rel="noopener noreferrer"
                  target="_blank"
                />
              }
            >
              Read the docs
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 text-sm @sm:grid-cols-2 @2xl:grid-cols-1">
            <div className="feature-card space-y-3 border-t pt-6">
              <FileDownloadIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">Install</span>
              </p>
              <code className="block font-mono text-xs text-muted-foreground">
                npm install -g allmd
              </code>
            </div>
            <div className="feature-card space-y-3 border-t pt-6">
              <ConsoleIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">Convert</span>
              </p>
              <code className="block font-mono text-xs text-muted-foreground">
                allmd https://example.com -o article.md
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Node.js API */}
      <section className="@container py-16 sm:py-24" id="api">
        <div className="mx-auto grid max-w-3xl gap-6 px-6 @2xl:grid-cols-2 @2xl:gap-12">
          <div className="space-y-4">
            <h2 className="text-balance text-3xl font-medium tracking-tight leading-[1.15]">
              Node.js API
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Import converters directly in your TypeScript projects.
            </p>
            <Button
              render={
                <a
                  href={`${siteConfig.links.docs}/api`}
                  rel="noopener noreferrer"
                  target="_blank"
                />
              }
            >
              API reference
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 text-sm @sm:grid-cols-2 @2xl:grid-cols-1">
            <div className="feature-card space-y-3 border-t pt-6">
              <MagicWandIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">Import</span>
              </p>
              <code className="block font-mono text-xs text-muted-foreground">
                {`import { convertWeb } from "allmd";`}
              </code>
            </div>
            <div className="feature-card space-y-3 border-t pt-6">
              <FileTextIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">Convert</span>
              </p>
              <code className="block font-mono text-xs text-muted-foreground">
                {`const { markdown } = await convertWeb("https://example.com");`}
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* AI agent skill */}
      <section className="@container py-16 sm:py-24" id="skill">
        <div className="mx-auto grid max-w-3xl gap-6 px-6 @2xl:grid-cols-2 @2xl:gap-12">
          <div className="space-y-4">
            <h2 className="text-balance text-3xl font-medium tracking-tight leading-[1.15]">
              AI agent skill
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Give your AI coding agent the ability to convert anything to
              markdown.
            </p>
            <Button
              render={
                <a
                  href={`${siteConfig.links.docs}/skills`}
                  rel="noopener noreferrer"
                  target="_blank"
                />
              }
            >
              Add the skill
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 text-sm @sm:grid-cols-2 @2xl:grid-cols-1">
            <div className="feature-card space-y-3 border-t pt-6">
              <FileDownloadIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">Install</span>
              </p>
              <code className="block font-mono text-xs text-muted-foreground">
                npx skills add mblode/allmd
              </code>
            </div>
            <div className="feature-card space-y-3 border-t pt-6">
              <SparkleIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">Use</span>
              </p>
              <code className="block font-mono text-xs text-muted-foreground">
                allmd youtube https://youtu.be/dQw4w9WgXcQ
              </code>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
