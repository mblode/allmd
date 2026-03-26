"use client";

import { GithubIcon, StarIcon } from "blode-icons-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { MorphIcon } from "@/components/ui/morph-icon";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

const navLinks: { external?: boolean; href: string; label: string }[] = [];

const linkClassName =
  "text-muted-foreground transition-colors hover:text-foreground";

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

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
          (isScrolled || menuOpen) && "border-border/40 border-b"
        )}
        data-state={menuOpen ? "active" : undefined}
      >
        <div className="mx-auto max-w-3xl px-6">
          <div className="relative flex flex-wrap items-center justify-between py-4 sm:gap-0">
            <div className="flex w-full justify-between gap-6 sm:w-auto sm:flex-1">
              <Link
                className="flex items-center gap-2 font-semibold tracking-[-0.02em]"
                href="/"
              >
                allmd
              </Link>

              <button
                aria-expanded={menuOpen}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                className="relative z-20 -m-2.5 -mr-4 flex min-h-11 min-w-11 cursor-pointer items-center justify-center sm:hidden"
                onClick={toggleMenu}
                type="button"
              >
                <MorphIcon
                  icon={menuOpen ? "cross" : "menu"}
                  size={24}
                  strokeWidth={1.25}
                />
              </button>
            </div>

            <div
              className={cn(
                "grid w-full transition-[grid-template-rows] duration-200 sm:flex sm:w-fit",
                menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col gap-4 pt-4 text-sm sm:flex-row sm:items-center sm:gap-4 sm:pt-0">
                  {navLinks.map((link) =>
                    link.external ? (
                      <a
                        className={linkClassName}
                        href={link.href}
                        key={link.href}
                        onClick={closeMenu}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        className={linkClassName}
                        href={link.href}
                        key={link.href}
                        onClick={closeMenu}
                      >
                        {link.label}
                      </Link>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="hidden sm:flex sm:flex-1 sm:justify-end">
              <Button
                onClick={closeMenu}
                render={
                  <a
                    href={siteConfig.links.github}
                    rel="noopener noreferrer"
                    target="_blank"
                  />
                }
                size="sm"
                variant="outline"
              >
                <GithubIcon data-icon="inline-start" />
                Star on GitHub
                <StarIcon data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
