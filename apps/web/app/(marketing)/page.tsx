import {
  ArrowRightIcon,
  ConsoleIcon,
  FileDownloadIcon,
  FileTextIcon,
  LayoutGrid1Icon,
  MagicWandIcon,
  SparkleIcon,
} from "blode-icons-react";
import { Fragment } from "react";

import { buttonVariants } from "@/components/ui/button-variants";
import { CopyButton } from "@/components/ui/copy-button";
import { siteConfig } from "@/lib/config";

const heroWords = "Everything is context.".split(" ");

const heroSubhead =
  "A talk, a post, a PDF, a recording. One command turns any of it into markdown.";

const skillKicker =
  'Now the answer to "what brings you here tonight" is context for my bot.';

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
      "Web, YouTube, PDF, Google Docs, video and audio, images, Word, EPUB, CSV, PowerPoint, tweets, RSS.",
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
      "A YAML header on every file with the title, source, date, and type.",
    icon: FileTextIcon,
    title: "Frontmatter",
  },
  {
    description:
      "--no-ai emits the raw extracted text. Faster, offline, and no OPENAI_API_KEY.",
    icon: ConsoleIcon,
    title: "No API key",
  },
];

export default function HomePage(): React.JSX.Element {
  return (
    <div>
      {/* Hero */}
      <section className="@container py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="text-balance font-medium text-4xl leading-[1.2] tracking-tight sm:text-5xl sm:leading-[1.15] sm:tracking-[-0.03em]">
            {heroWords.map((word, index) => (
              <Fragment key={word}>
                <span
                  className="blur-up-word"
                  style={{ animationDelay: `${index * 0.04}s` }}
                >
                  {word}
                </span>
                {index < heroWords.length - 1 ? " " : null}
              </Fragment>
            ))}
          </h1>
          <p
            className="mx-auto mt-4 max-w-[60ch] text-lg text-muted-foreground leading-relaxed blur-up"
            style={{ animationDelay: "0.35s" }}
          >
            {heroSubhead}
          </p>
          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-3 blur-up"
            style={{ animationDelay: "0.5s" }}
          >
            <a
              className={buttonVariants({ size: "lg" })}
              href={`${siteConfig.links.docs}/skills`}
              rel="noopener noreferrer"
              target="_blank"
            >
              Install the skill
            </a>
          </div>
          <code
            className="relative mt-8 inline-flex items-center gap-2 font-mono text-muted-foreground text-sm blur-up"
            style={{ animationDelay: "0.65s" }}
          >
            <span>npx skills add mblode/allmd</span>
            <CopyButton content="npx skills add mblode/allmd" />
          </code>
        </div>
      </section>

      {/* Agent skill */}
      <section className="@container pt-8 pb-16 sm:pt-16 sm:pb-24" id="skill">
        <div className="mx-auto grid max-w-3xl @2xl:grid-cols-2 @2xl:gap-12 gap-6 px-6">
          <div className="space-y-4">
            <h2 className="text-balance font-medium text-3xl leading-[1.15] tracking-tight">
              Agent skill
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Install once. Your agent converts instead of scraping. Claude
              Code, Cursor, Codex.
            </p>
            <a
              className={buttonVariants()}
              href={`${siteConfig.links.docs}/skills`}
              rel="noopener noreferrer"
              target="_blank"
            >
              Add the skill
              <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
            </a>
          </div>
          <div className="grid @2xl:grid-cols-1 @sm:grid-cols-2 grid-cols-1 gap-6 text-sm">
            <div className="feature-card space-y-3 border-t pt-6">
              <FileDownloadIcon
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">Install</span>
              </p>
              <code className="block font-mono text-muted-foreground text-xs">
                npx skills add mblode/allmd
              </code>
            </div>
            <div className="feature-card space-y-3 border-t pt-6">
              <SparkleIcon
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">Use</span>
              </p>
              <code className="block font-mono text-muted-foreground text-xs">
                /allmd https://youtu.be/dQw4w9WgXcQ
              </code>
            </div>
            <p className="@2xl:col-span-1 @sm:col-span-2 text-muted-foreground text-xs leading-5">
              {skillKicker}
            </p>
          </div>
        </div>
      </section>

      {/* Sources */}
      <section className="@container py-16 sm:py-24" id="features">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-balance font-medium text-3xl leading-[1.15] tracking-tight">
            Twelve sources, one command
          </h2>
          <div className="mt-12 grid @sm:grid-cols-2 @xl:grid-cols-3 grid-cols-1 gap-6 text-sm">
            {features.map((feature) => (
              <div
                className="feature-card space-y-3 border-t pt-6"
                key={feature.title}
              >
                <feature.icon
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
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
              <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
            </a>
          </div>
          <div className="grid @2xl:grid-cols-1 @sm:grid-cols-2 grid-cols-1 gap-6 text-sm">
            <div className="feature-card space-y-3 border-t pt-6">
              <FileDownloadIcon
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">Install</span>
              </p>
              <code className="block font-mono text-muted-foreground text-xs">
                npm install -g allmd
              </code>
            </div>
            <div className="feature-card space-y-3 border-t pt-6">
              <ConsoleIcon
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
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
              <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
            </a>
          </div>
          <div className="grid @2xl:grid-cols-1 @sm:grid-cols-2 grid-cols-1 gap-6 text-sm">
            <div className="feature-card space-y-3 border-t pt-6">
              <MagicWandIcon
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">Import</span>
              </p>
              <code className="block font-mono text-muted-foreground text-xs">
                {`import { convertWeb } from "allmd";`}
              </code>
            </div>
            <div className="feature-card space-y-3 border-t pt-6">
              <FileTextIcon
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
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
    </div>
  );
}
