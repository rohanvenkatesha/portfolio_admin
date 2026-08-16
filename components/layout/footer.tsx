"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { ArrowUp, ArrowUpRight, Clock } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/fx/reveal";
import { StatusPulse } from "@/components/fx/effects";
import { ContactForm } from "@/components/contact/contact-form";
import { ContactRows } from "@/components/contact/contact-rows";
import { projects as fallbackProjects, type Project } from "@/content/site";
import { useProfile } from "@/components/providers/profile-provider";
import { navSections as fallbackNavSections } from "@/content/sections";
import type { NavSection } from "./shell";
import { useCopy } from "@/components/providers/copy-provider";

function subscribeToSeconds(onChange: () => void) {
  const interval = setInterval(onChange, 1000);
  return () => clearInterval(interval);
}

/** Whole-second snapshot — a stable primitive, so React can compare it safely. */
function getSecondsSnapshot() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Live clock in the profile's timezone.
 *
 * Returns null on the server and during the first paint — the time is
 * inherently client-only, and rendering it during SSR would guarantee a
 * hydration mismatch.
 */
function LocalClock() {
  const profile = useProfile();
  const seconds = useSyncExternalStore(subscribeToSeconds, getSecondsSnapshot, () => null);

  const time =
    seconds === null
      ? null
      : new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: profile.timezone,
        }).format(new Date(seconds * 1000));

  return (
    <span className="inline-flex items-center gap-2 font-mono text-sm text-zinc-400">
      <Clock className="h-3.5 w-3.5 text-brand-500" />
      <span className="tabular-nums">{time ?? "--:--:--"}</span>
      <span className="text-zinc-600">
        {profile.timezone.split("/")[1]?.replace("_", " ") ?? profile.timezone}
      </span>
    </span>
  );
}

/** Text link that slides its arrow in on hover. */
function FooterLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const content = (
    <>
      <span className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/link:translate-x-1">
        {children}
      </span>
      <ArrowUpRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/link:translate-x-0 group-hover/link:opacity-100" />
    </>
  );

  const className =
    "group/link inline-flex items-center gap-1 text-[13px] text-zinc-500 transition-colors hover:text-brand-400";

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

/**
 * Contact and footer as one closing panel.
 *
 * They were two stacked panels repeating the same information — socials, email
 * and location each appeared twice. Merged, the page ends once: an invitation,
 * the ways to reach me, the sitemap, then the wordmark.
 *
 * `withContact` is false on detail routes, which want a footer but not a
 * second contact form.
 */
export function Footer({
  projects = fallbackProjects,
  navSections = fallbackNavSections as unknown as NavSection[],
  withContact = false,
}: {
  projects?: Project[];
  navSections?: NavSection[];
  withContact?: boolean;
}) {
  const copy = useCopy("contact");
  const profile = useProfile();
  const [showTop, setShowTop] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => setShowTop(latest > 600));

  // A short selection rather than all nineteen
  const featured = projects.filter((p) => p.featured).slice(0, 5);

  return (
    <footer className="relative px-3 pb-3 sm:px-5 lg:px-6">
      <div className="relative mx-auto w-full max-w-[100rem] overflow-hidden rounded-[1.75rem] border border-white/8 bg-panel">
        {/* ---------------- Contact ---------------- */}
        {withContact ? (
          <div
            id="contact"
            className="scroll-mt-24 border-b border-white/8 px-6 py-14 sm:px-10 sm:py-16 lg:px-14"
          >
            {/**
             * `min-w-0` on both columns is load-bearing, not defensive.
             *
             * A grid track sized `auto`/`1fr` won't shrink below its content's
             * min-content width, and the email address in ContactRows is
             * `truncate` — which means `white-space: nowrap`, so its min-content
             * is the whole 25-character string. That floored the track at 343px
             * inside a 301px content box, pushing the heading, rows and form 42px
             * past their own padding and 18px past the panel edge on a phone.
             * Zeroing the minimum lets the track match the container and the
             * address ellipsise, which is what `truncate` was there to do.
             */}
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div className="min-w-0">
                <SectionHeading
                  eyebrow={copy.eyebrow}
                  title={
                    <>
                      {copy.titleLead}
                      <br />
                      <span className="text-brand-500">{copy.titleAccent}</span>
                    </>
                  }
                  description={copy.description}
                />

                <Reveal direction="up" delay={0.12} className="mt-8">
                  <StatusPulse label={profile.availability} />
                </Reveal>

                <Reveal direction="up" delay={0.16} className="mt-9">
                  <ContactRows />
                </Reveal>
              </div>

              <Reveal direction="left" delay={0.1} className="min-w-0">
                <ContactForm />
              </Reveal>
            </div>
          </div>
        ) : null}

        {/* ---------------- Sitemap ---------------- */}
        <div className="px-6 pt-14 sm:px-10 lg:px-14">
          {/**
           * Three link lists and a brand block.
           *
           * One column until `lg` stacked all four on phones and tablets alike,
           * running the sitemap to 896px — over two screens of footer on a
           * phone. Menu and Elsewhere are short labels that pair happily in two
           * columns; Selected Work holds full project titles and needs the full
           * width, so it's ordered below them rather than beside.
           *
           * The order only differs below `lg`, where the four-column row puts
           * everything back in document order.
           */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-10">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 font-mono text-xs font-bold text-[var(--brand-ink)]">
                  {profile.initials}
                </span>
                <span className="text-base font-semibold tracking-tight text-white">
                  {profile.name}
                </span>
              </div>

              <p className="mt-5 max-w-xs text-[13px] leading-relaxed text-zinc-500">
                {profile.tagline}
              </p>

              <div className="mt-6">
                <LocalClock />
              </div>
            </div>

            {/* Menu */}
            <div>
              <p className="eyebrow mb-5 text-zinc-600">Menu</p>
              <ul className="space-y-3">
                {navSections.map((section) => (
                  <li key={section.id}>
                    <FooterLink href={`#${section.id}`}>{section.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Selected work — full width below lg, since project titles wrap
                badly in a half column */}
            <div className="order-1 col-span-2 lg:order-none lg:col-span-1">
              <p className="eyebrow mb-5 text-zinc-600">Selected Work</p>
              <ul className="space-y-3">
                {featured.map((project) => (
                  <li key={project.id}>
                    <FooterLink href={`/work/${project.slug}`}>{project.title}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            <div>
              <p className="eyebrow mb-5 text-zinc-600">Elsewhere</p>
              <ul className="space-y-3">
                {profile.socials.map((social) => (
                  <li key={social.label}>
                    <FooterLink href={social.href} external={!social.href.startsWith("mailto:")}>
                      {social.label}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Base rule */}
          <div className="mt-14 flex flex-col-reverse items-center justify-between gap-4 border-t border-white/8 py-7 sm:flex-row">
            <p className="text-[11px] text-zinc-600">
              © {new Date().getFullYear()} {profile.name}. All rights reserved.
            </p>
            <p className="font-mono text-[11px] text-zinc-700">
              Next.js · Tailwind · Framer Motion · Three.js
            </p>
          </div>
        </div>

        {/* ---------------- Oversized wordmark ---------------- */}
        <div aria-hidden className="pointer-events-none select-none overflow-hidden">
          <span className="display-name block translate-y-[18%] whitespace-nowrap text-center text-white/[0.045] [font-size:clamp(3rem,15vw,13rem)]">
            {profile.name.split(" ")[0].toUpperCase()}
          </span>
        </div>
      </div>

      {/* Scroll to top */}
      <motion.button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll back to top"
        initial={false}
        animate={{
          opacity: showTop ? 1 : 0,
          scale: showTop ? 1 : 0.7,
          pointerEvents: showTop ? "auto" : "none",
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="group fixed bottom-6 right-6 z-[58] rounded-full border border-white/12 bg-panel-2 p-3.5 text-zinc-300 backdrop-blur-md transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-[var(--brand-ink)]"
      >
        <ArrowUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
      </motion.button>
    </footer>
  );
}
