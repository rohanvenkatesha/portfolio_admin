"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "motion/react";
import { Command, Menu, X } from "lucide-react";
import { profile } from "@/content/site";
import { navSections as fallbackNavSections } from "@/content/sections";
import type { NavSection } from "./shell";
import { cn } from "@/lib/utils";

export function Nav({
  onOpenPalette,
  navSections = fallbackNavSections as unknown as NavSection[],
}: {
  onOpenPalette: () => void;
  navSections?: NavSection[];
}) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("hero");
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => setScrolled(latest > 40));

  // Track which section is currently in the viewport's upper band
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.1, 0.3, 0.6] }
    );

    for (const section of navSections) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [navSections]);

  // Lock body scroll while the mobile sheet is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-[60] px-4 pt-4"
      >
        {/* Width matches the section panels below, so the bar sits on the same
            grid rather than floating narrower than everything else. */}
        <nav
          className={cn(
            "mx-auto flex max-w-[100rem] items-center justify-between gap-4 rounded-full px-5 py-3 transition-all duration-500",
            scrolled
              ? "glass shadow-[0_8px_40px_-12px_rgba(0,0,0,0.8)]"
              : // Faint presence at the top of the page, rather than nothing
                "border border-white/8 bg-panel/40 backdrop-blur-sm"
          )}
        >
          {/* Wordmark */}
          <a
            href="#hero"
            className="group flex items-center gap-2.5"
            aria-label={`${profile.name} — home`}
          >
            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-500 font-mono text-[11px] font-bold text-[var(--brand-ink)]">
              {profile.initials}
              <span className="absolute inset-0 rounded-lg bg-gradient-to-br from-brand-400 to-brand-500 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-80" />
            </span>
            <span className="hidden whitespace-nowrap text-sm font-semibold tracking-tight text-white sm:block">
              {profile.name}
            </span>
          </a>

          {/* Desktop links */}
          <ul className="hidden items-center gap-1 md:flex">
            {navSections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={cn(
                    "relative block rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors",
                    active === section.id ? "text-white" : "text-zinc-400 hover:text-white"
                  )}
                >
                  {/* Accent-tinted, matching every other active state in the
                      design — the section switcher, filters and dots. */}
                  {active === section.id ? (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-full bg-brand-500/18 ring-1 ring-brand-500/40"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  ) : null}
                  <span className="relative z-10">{section.label}</span>
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            {/* Command palette trigger */}
            <button
              onClick={onOpenPalette}
              aria-label="Open command palette"
              className="glass inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] text-zinc-400 transition-all hover:border-brand-400/40 hover:text-brand-200"
            >
              <Command className="h-3.5 w-3.5" />
              <span className="hidden font-mono sm:block">K</span>
            </button>

            <a
              href="#contact"
              className="hidden rounded-full bg-brand-500 px-4 py-2 text-[13px] font-semibold text-[var(--brand-ink)] transition-all hover:bg-brand-400 sm:block"
            >
              Hire me
            </a>

            {/* Mobile toggle */}
            <button
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="glass rounded-full p-2.5 text-zinc-300 md:hidden"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile sheet */}
      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[59] bg-void/90 backdrop-blur-xl md:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <motion.ul
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex h-full flex-col items-center justify-center gap-2"
            >
              {navSections.map((section, index) => (
                <motion.li
                  key={section.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * index, duration: 0.4 }}
                >
                  <a
                    href={`#${section.id}`}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "block px-6 py-3 text-2xl font-semibold transition-colors",
                      active === section.id ? "text-brand-300" : "text-zinc-400 hover:text-white"
                    )}
                  >
                    {section.label}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Desktop section dots */}
      <div className="fixed right-6 top-1/2 z-[55] hidden -translate-y-1/2 flex-col gap-3 xl:flex">
        {navSections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-label={section.label}
            className="group relative flex items-center justify-end gap-3"
          >
            <span className="pointer-events-none absolute right-6 whitespace-nowrap text-[11px] font-medium text-zinc-500 opacity-0 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100">
              {section.label}
            </span>
            <span
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-300",
                active === section.id
                  ? "scale-125 bg-brand-400 shadow-[0_0_12px_2px_color-mix(in_oklab,var(--color-brand-500)_70%,transparent)]"
                  : "bg-white/20 group-hover:bg-white/50"
              )}
            />
          </a>
        ))}
      </div>
    </>
  );
}
