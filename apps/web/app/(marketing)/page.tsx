"use client";

import {
  ArrowRightIcon,
  ConsoleIcon,
  FileDownloadIcon,
  FileTextIcon,
  LayoutGrid1Icon,
  MagicWandIcon,
  SparkleIcon,
} from "blode-icons-react";
import { SplitText } from "griffo/motion";
import { stagger } from "motion";
import { motion } from "motion/react";

import { buttonVariants } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { siteConfig } from "@/lib/config";

const features = [
  {
    description: "Pass any URL or file path. allmd figures out the type.",
    icon: SparkleIcon,
    title: "Auto-detect",
  },
  {
    description: "AI cleans up the output into consistent, readable markdown.",
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
    description: "Works with Claude Code, Cursor, and other AI coding agents.",
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
            className="text-balance font-medium text-4xl leading-[1.2] tracking-tight sm:text-5xl sm:leading-[1.15] sm:tracking-[-0.03em]"
            initial={false}
            options={{ type: "words" }}
            transition={{
              delay: stagger(0.04),
              duration: 0.65,
              ease: [0.25, 1, 0.5, 1],
            }}
          >
            <span>Turn the whole universe into markdown.</span>
          </SplitText>
          <motion.p
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            className="mx-auto mt-4 max-w-[60ch] text-lg text-muted-foreground leading-relaxed"
            initial={false}
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
            initial={false}
            transition={{
              delay: 0.5,
              duration: 0.65,
              ease: [0.25, 1, 0.5, 1],
            }}
          >
            <a
              className={buttonVariants({ size: "lg" })}
              href={`${siteConfig.links.docs}/cli`}
              rel="noopener noreferrer"
              target="_blank"
            >
              Get started
            </a>
          </motion.div>
          <motion.code
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            className="relative mt-8 inline-flex items-center gap-2 font-mono text-muted-foreground text-sm"
            initial={false}
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
      <section
        className="@container pt-8 pb-16 sm:pt-16 sm:pb-24"
        id="features"
      >
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-balance font-medium text-3xl leading-[1.15] tracking-tight">
            Features
          </h2>
          <div className="mt-12 grid @sm:grid-cols-2 @xl:grid-cols-3 grid-cols-1 gap-6 text-sm">
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
        <div className="mx-auto grid max-w-3xl @2xl:grid-cols-2 @2xl:gap-12 gap-6 px-6">
          <div className="space-y-4">
            <h2 className="text-balance font-medium text-3xl leading-[1.15] tracking-tight">
              Install
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              One command to set up, one command to convert.
            </p>
            <a
              className={buttonVariants()}
              href={`${siteConfig.links.docs}/cli/installation`}
              rel="noopener noreferrer"
              target="_blank"
            >
              Read the docs
              <ArrowRightIcon data-icon="inline-end" />
            </a>
          </div>
          <div className="grid @2xl:grid-cols-1 @sm:grid-cols-2 grid-cols-1 gap-6 text-sm">
            <div className="feature-card space-y-3 border-t pt-6">
              <FileDownloadIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">Install</span>
              </p>
              <code className="block font-mono text-muted-foreground text-xs">
                npm install -g allmd
              </code>
            </div>
            <div className="feature-card space-y-3 border-t pt-6">
              <ConsoleIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">Convert</span>
              </p>
              <code className="block font-mono text-muted-foreground text-xs">
                allmd https://example.com
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Node.js API */}
      <section className="@container py-16 sm:py-24" id="api">
        <div className="mx-auto grid max-w-3xl @2xl:grid-cols-2 @2xl:gap-12 gap-6 px-6">
          <div className="space-y-4">
            <h2 className="text-balance font-medium text-3xl leading-[1.15] tracking-tight">
              Node.js API
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Import converters directly in your TypeScript projects.
            </p>
            <a
              className={buttonVariants()}
              href={`${siteConfig.links.docs}/api`}
              rel="noopener noreferrer"
              target="_blank"
            >
              API reference
              <ArrowRightIcon data-icon="inline-end" />
            </a>
          </div>
          <div className="grid @2xl:grid-cols-1 @sm:grid-cols-2 grid-cols-1 gap-6 text-sm">
            <div className="feature-card space-y-3 border-t pt-6">
              <MagicWandIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">Import</span>
              </p>
              <code className="block font-mono text-muted-foreground text-xs">
                {`import { convertWeb } from "allmd";`}
              </code>
            </div>
            <div className="feature-card space-y-3 border-t pt-6">
              <FileTextIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">Convert</span>
              </p>
              <code className="block font-mono text-muted-foreground text-xs">
                {`const { markdown } = await convertWeb("https://example.com");`}
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* AI agent skill */}
      <section className="@container py-16 sm:py-24" id="skill">
        <div className="mx-auto grid max-w-3xl @2xl:grid-cols-2 @2xl:gap-12 gap-6 px-6">
          <div className="space-y-4">
            <h2 className="text-balance font-medium text-3xl leading-[1.15] tracking-tight">
              AI agent skill
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Give your AI coding agent the ability to convert anything to
              markdown.
            </p>
            <a
              className={buttonVariants()}
              href={`${siteConfig.links.docs}/skills`}
              rel="noopener noreferrer"
              target="_blank"
            >
              Add the skill
              <ArrowRightIcon data-icon="inline-end" />
            </a>
          </div>
          <div className="grid @2xl:grid-cols-1 @sm:grid-cols-2 grid-cols-1 gap-6 text-sm">
            <div className="feature-card space-y-3 border-t pt-6">
              <FileDownloadIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">Install</span>
              </p>
              <code className="block font-mono text-muted-foreground text-xs">
                npx skills add mblode/allmd
              </code>
            </div>
            <div className="feature-card space-y-3 border-t pt-6">
              <SparkleIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">Use</span>
              </p>
              <code className="block font-mono text-muted-foreground text-xs">
                /allmd https://youtu.be/dQw4w9WgXcQ
              </code>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
