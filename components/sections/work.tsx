"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, ChevronDown, Layers } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/fx/reveal";
import { GithubIcon } from "@/components/ui/brand-icons";
import { ProjectDetail } from "@/components/work/project-detail";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { projectFilters, projects as fallbackProjects, type Project } from "@/content/site";
import { cn } from "@/lib/utils";

/** Cards shown before the visitor asks for the rest. */
const INITIAL_COUNT = 6;

/**
 * Cover treatment per project. All warm or neutral — the single-accent rule
 * holds; the variation is in weight so a grid of cards has rhythm.
 */
const COVERS: Record<Project["accent"], string> = {
  cyan: "from-orange-500/55 via-orange-900/30 to-zinc-950",
  violet: "from-orange-600/40 via-zinc-800 to-zinc-950",
  amber: "from-orange-400/50 via-orange-800/25 to-zinc-950",
  lime: "from-orange-300/35 via-zinc-800 to-zinc-950",
  rose: "from-orange-700/55 via-zinc-800 to-zinc-950",
};

const GRAIN =
  "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")";

/**
 * Projects come from the server (Firestore, or the repo as fallback). The
 * prop is optional so the section still renders standalone in isolation.
 */
export function Work({ projects = fallbackProjects }: { projects?: Project[] }) {
  const [filter, setFilter] = useState<(typeof projectFilters)[number]>("All");
  const [active, setActive] = useState<Project | null>(null);
  const [expanded, setExpanded] = useState(false);

  const matching = useMemo(
    () => (filter === "All" ? projects : projects.filter((p) => p.category === filter)),
    [filter, projects]
  );

  const visible = expanded ? matching : matching.slice(0, INITIAL_COUNT);
  const hidden = matching.length - visible.length;

  return (
    <section id="work" className="relative scroll-mt-24 px-3 py-3 sm:px-5 lg:px-6">
      <div className="relative mx-auto w-full max-w-[100rem] overflow-hidden rounded-[1.75rem] border border-white/8 bg-panel px-6 py-14 sm:px-10 sm:py-16 lg:px-14">
        {/* Heading + filters */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Selected Work"
            title={
              <>
                Things I&apos;ve
                <br />
                <span className="text-orange-500">actually built</span>
              </>
            }
            description={`${projects.length} public projects — retrieval systems, computer vision, full-stack apps and compiler front-ends. Every one links to its source.`}
          />

          <Reveal direction="up" delay={0.1}>
            <div className="flex flex-wrap gap-2">
              {projectFilters.map((option) => {
                const isActive = filter === option;
                const count =
                  option === "All"
                    ? projects.length
                    : projects.filter((p) => p.category === option).length;

                return (
                  <button
                    key={option}
                    onClick={() => {
                      setFilter(option);
                      setExpanded(false);
                    }}
                    className={cn(
                      "rounded-full border px-4 py-2 text-[13px] font-medium transition-all duration-300",
                      isActive
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-white/10 bg-panel-2 text-zinc-400 hover:border-white/25 hover:text-white"
                    )}
                  >
                    {option}
                    <span
                      className={cn(
                        "ml-2 font-mono text-[10px]",
                        isActive ? "text-white/70" : "text-zinc-600"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </Reveal>
        </div>

        {/* Grid */}
        <motion.div layout className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((project, index) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -12 }}
                transition={{
                  duration: 0.45,
                  delay: Math.min(index * 0.05, 0.25),
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <ProjectCard project={project} onOpen={() => setActive(project)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {hidden > 0 ? (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setExpanded(true)}
              className="group inline-flex items-center gap-2 rounded-full border border-white/12 bg-panel-2 px-5 py-3 text-sm font-semibold text-zinc-200 transition-all hover:border-orange-500/50 hover:text-orange-300"
            >
              Show {hidden} more {hidden === 1 ? "project" : "projects"}
              <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
            </button>
          </div>
        ) : null}

        {matching.length === 0 ? (
          <p className="mt-10 text-center text-sm text-zinc-500">Nothing in this category yet.</p>
        ) : null}
      </div>

      {/* Deep-dive modal (single instance, driven by the active project) */}
      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="p-0">
          {active ? (
            <>
              {/* Radix needs a title for the dialog's accessible name; the
                  visible heading lives inside ProjectDetail. */}
              <DialogTitle className="sr-only">{active.title}</DialogTitle>
              <ProjectDetail project={active} />

              <div className="border-t border-white/10 px-8 py-5 sm:px-10">
                <Link
                  href={`/work/${active.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-400 transition-colors hover:text-orange-300"
                >
                  Open as a full page
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

/**
 * Image-led card: a cover plate carries the identity, with the label and title
 * overlaid at the bottom. The whole card is a link to the project page; the
 * hover actions sit above it on their own layer so both stay clickable and the
 * markup stays valid (no interactive elements nested inside the link).
 */
function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  return (
    <article className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/8 bg-panel-2">
      {/* Cover plate */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br transition-transform duration-700 ease-out group-hover:scale-105",
          COVERS[project.accent]
        )}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
          style={{ backgroundImage: GRAIN }}
        />
      </div>

      {/* Legibility scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

      {/* Full-card link target */}
      <Link
        href={`/work/${project.slug}`}
        className="absolute inset-0 z-10"
        aria-label={`${project.title} — full project page`}
      />

      {/* Caption */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-5">
        <span className="eyebrow text-[10px] text-orange-400">{project.category}</span>
        <h3 className="mt-1.5 text-lg font-semibold leading-snug text-white">{project.title}</h3>

        {/* Blurb slides in on hover */}
        <p className="mt-2 max-h-0 overflow-hidden text-[12.5px] leading-relaxed text-zinc-300 opacity-0 transition-all duration-500 group-hover:max-h-28 group-hover:opacity-100">
          {project.blurb}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.stack.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="rounded-md border border-white/15 bg-black/40 px-2 py-0.5 font-mono text-[10px] text-zinc-300 backdrop-blur-sm"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Hover actions, above the link layer */}
      <div className="absolute right-4 top-4 z-30 flex gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <button
          onClick={onOpen}
          aria-label={`${project.title} — quick look`}
          title="Quick look"
          className="rounded-full border border-white/20 bg-black/60 p-2.5 text-white backdrop-blur-md transition-colors hover:border-orange-400 hover:text-orange-300"
        >
          <Layers className="h-3.5 w-3.5" />
        </button>

        {project.repo ? (
          <a
            href={project.repo}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${project.title} source on GitHub`}
            className="rounded-full border border-white/20 bg-black/60 p-2.5 text-white backdrop-blur-md transition-colors hover:border-white/50"
          >
            <GithubIcon className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>

      {/* Corner arrow */}
      <span className="absolute left-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100">
        <ArrowUpRight className="h-4 w-4 text-white" />
      </span>
    </article>
  );
}
