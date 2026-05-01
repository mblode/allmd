"use client";

import { GithubIcon, StarIcon } from "blode-icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50);
          ticking = false;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header>
      <nav
        className={cn(
          "fixed z-20 w-full bg-background/80 backdrop-blur-lg transition-[border-color,background-color,backdrop-filter] duration-300",
          isScrolled && "border-border/40 border-b"
        )}
      >
        <div className="mx-auto max-w-3xl px-6">
          <div className="relative flex items-center justify-between py-4">
            <Link
              className="flex items-center gap-2 font-semibold tracking-[-0.02em]"
              href="/"
            >
              allmd
            </Link>

            <a
              className={buttonVariants({ size: "sm", variant: "outline" })}
              href={siteConfig.links.github}
              rel="noopener noreferrer"
              target="_blank"
            >
              <GithubIcon data-icon="inline-start" />
              Star on GitHub
              <StarIcon data-icon="inline-end" />
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};
