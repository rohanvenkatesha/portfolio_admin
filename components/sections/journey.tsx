"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Award, Briefcase, ChevronDown, GraduationCap, Milestone } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/fx/reveal";
import { PillLink, TechBadge } from "@/components/ui/primitives";
import { timeline, type TimelineEntry, type TimelineTrack } from "@/content/site";
import { cn } from "@/lib/utils";

type View = TimelineTrack | "blended";

const VIEWS: { id: View; label: string; hint: string }[] = [
  { id: "tech", label: "Technical", hint: "Education & career" },
  { id: "blended", label: "Blended", hint: "Everything, in order" },
  { id: "life", label: "Creative", hint: "Life & visual milestones" },
];

const kindMeta = {
  work: { icon: Briefcase, label: "Role" },
  education: { icon: GraduationCap, label: "Education" },
  award: { icon: Award, label: "Honour" },
  milestone: { icon: Milestone, label: "Milestone" },
} as const;

/** Pull the first four-digit year out of a period string for sorting. */
function startYear(period: string) {
  const match = period.match(/\d{4}/);
  return match ? Number(match[0]) : 0;
}

export function Journey() {
  const [view, setView] = useState<View>("tech");

  const entries = useMemo(() => {
    if (view === "blended") {
      return [...timeline].sort((a, b) => startYear(b.period) - startYear(a.period));
    }
    return timeline.filter((entry) => entry.track === view);
  }, [view]);

  return (
    <section id="journey" className="relative scroll-mt-24 px-3 py-3 sm:px-5 lg:px-6">
      <div className="relative mx-auto w-full max-w-[100rem] overflow-hidden rounded-[1.75rem] border border-white/8 bg-panel px-6 py-14 sm:px-10 sm:py-16 lg:px-14">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {/* ---------------- Left: heading, switcher, CTA ---------------- */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              eyebrow="The Journey"
              title={
                <>
                  Two tracks,
                  <br />
                  <span className="text-orange-500">one person</span>
                </>
              }
              description="The engineering career and the creative life didn't happen in sequence — they happened at the same time, and kept feeding each other."
            />

            {/* Track switcher */}
            <Reveal direction="up" delay={0.12} className="mt-8">
              <div
                role="tablist"
                aria-label="Timeline track"
                className="inline-flex flex-wrap gap-1 rounded-full border border-white/8 bg-panel-2 p-1.5"
              >
                {VIEWS.map((option) => {
                  const active = view === option.id;
                  return (
                    <button
                      key={option.id}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setView(option.id)}
                      title={option.hint}
                      className={cn(
                        "relative rounded-full px-4 py-2 text-[13px] font-medium transition-colors",
                        active ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="track-pill"
                          className="absolute inset-0 rounded-full bg-orange-500"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      ) : null}
                      <span className="relative z-10">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </Reveal>

            <Reveal direction="up" delay={0.2} className="mt-8">
              <PillLink href="#work">See the work</PillLink>
            </Reveal>
          </div>

          {/* ---------------- Right: rows ---------------- */}
          <AnimatePresence mode="wait">
            <motion.ol
              key={view}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="border-t border-white/8"
            >
              {entries.map((entry, index) => (
                <TimelineRow key={entry.id} entry={entry} index={index} />
              ))}
            </motion.ol>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function TimelineRow({ entry, index }: { entry: TimelineEntry; index: number }) {
  const [open, setOpen] = useState(false);
  const meta = kindMeta[entry.kind];
  const Icon = meta.icon;

  return (
    <motion.li
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.3), ease: [0.16, 1, 0.3, 1] }}
      className="border-b border-white/8"
    >
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="group w-full py-6 text-left transition-colors"
      >
        {/* year | title+org | summary — the row rhythm of the reference */}
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-start">
          <span className="font-mono text-[11px] leading-6 text-orange-500">{entry.period}</span>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
              <h3 className="text-base font-semibold text-white transition-colors group-hover:text-orange-400 sm:text-lg">
                {entry.title}
              </h3>
            </div>
            <p className="mt-1 text-[13px] text-zinc-500">
              {entry.org}
              {entry.location ? <span className="text-zinc-600"> · {entry.location}</span> : null}
            </p>
            <p className="mt-2.5 max-w-xl text-[13px] leading-relaxed text-zinc-400">
              {entry.summary}
            </p>
          </div>

          <ChevronDown
            className={cn(
              "hidden h-4 w-4 shrink-0 text-zinc-600 transition-transform duration-300 group-hover:text-white sm:mt-1 sm:block",
              open && "rotate-180"
            )}
          />
        </div>

        {/* Expandable detail */}
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-5 sm:pl-[8.5rem]">
                <ul className="space-y-2.5">
                  {entry.highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-3 text-[13px] text-zinc-300">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-orange-500" />
                      <span className="leading-relaxed">{highlight}</span>
                    </li>
                  ))}
                </ul>

                {entry.stack?.length ? (
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {entry.stack.map((tech) => (
                      <TechBadge key={tech}>{tech}</TechBadge>
                    ))}
                  </div>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {!open ? (
          <span className="mt-3 inline-block text-[11px] font-medium text-zinc-600 transition-colors group-hover:text-orange-500 sm:ml-[8.5rem]">
            Read more →
          </span>
        ) : null}
      </button>
    </motion.li>
  );
}
