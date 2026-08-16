"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Award, Briefcase, GraduationCap, Milestone, Plus } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/fx/reveal";
import { EmberBackdrop } from "@/components/fx/ember-backdrop";
import { TechBadge } from "@/components/ui/primitives";
import { timeline, type TimelineEntry, type TimelineTrack } from "@/content/site";
import { cn } from "@/lib/utils";
import { useCopy } from "@/components/providers/copy-provider";

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

/** Pull the first four-digit year out of a period string. */
function startYear(period: string) {
  const match = period.match(/\d{4}/);
  return match ? match[0] : "";
}

export function Journey() {
  const copy = useCopy("journey");
  const [view, setView] = useState<View>("tech");
  const [openId, setOpenId] = useState<string | null>(null);

  const entries = useMemo(() => {
    const list =
      view === "blended"
        ? [...timeline].sort((a, b) => Number(startYear(b.period)) - Number(startYear(a.period)))
        : timeline.filter((entry) => entry.track === view);
    return list;
  }, [view]);

  return (
    <section id="journey" className="relative scroll-mt-24 px-3 py-3 sm:px-5 lg:px-6">
      <div className="relative mx-auto w-full max-w-[100rem] overflow-hidden rounded-[1.75rem] border border-white/8 bg-panel px-6 py-14 sm:px-10 sm:py-16 lg:px-14">
        {/* ---------------- Heading + switcher, full width ---------------- */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
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

          <Reveal direction="up" delay={0.12}>
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
                    onClick={() => {
                      setView(option.id);
                      setOpenId(null);
                    }}
                    title={option.hint}
                    className={cn(
                      "relative rounded-full px-4 py-2 text-[13px] font-medium transition-colors",
                      active ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="track-pill"
                        className="absolute inset-0 rounded-full bg-brand-500"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    ) : null}
                    <span className="relative z-10">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </Reveal>
        </div>

        {/* ---------------- Full-width entry cards ---------------- */}
        <AnimatePresence mode="wait">
          <motion.ol
            key={view}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 space-y-3"
          >
            {entries.map((entry, index) => (
              <JourneyCard
                key={entry.id}
                entry={entry}
                index={index}
                open={openId === entry.id}
                onToggle={() => setOpenId((id) => (id === entry.id ? null : entry.id))}
              />
            ))}
          </motion.ol>
        </AnimatePresence>
      </div>
    </section>
  );
}

/**
 * One entry as a full-width card.
 *
 * The year is set oversized as a ghost numeral on the left — it gives the
 * section a spine to scan down without needing a drawn rail, and it warms to
 * the accent as the card opens.
 */
function JourneyCard({
  entry,
  index,
  open,
  onToggle,
}: {
  entry: TimelineEntry;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const meta = kindMeta[entry.kind];
  const Icon = meta.icon;

  return (
    <motion.li
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "group relative block w-full overflow-hidden rounded-2xl border text-left transition-colors duration-500",
          open ? "border-white/15" : "border-white/8 bg-panel-2/60 hover:border-white/20"
        )}
      >
        {/**
         * Open cards take the full ember treatment. Transient emphasis rather
         * than a permanent warm block — only the entry you're reading is lit,
         * so the accent keeps its meaning.
         */}
        <AnimatePresence>
          {open ? (
            <motion.span
              key="ember"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <EmberBackdrop drift={false} />
            </motion.span>
          ) : null}
        </AnimatePresence>

        {/* Hover wash, closed state only — it would muddy the ember ground */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 origin-left bg-gradient-to-r from-brand-500/12 via-brand-500/5 to-transparent transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
            open ? "scale-x-0" : "scale-x-0 group-hover:scale-x-100"
          )}
        />

        {/**
         * Below `sm` the year moves onto its own line and the toggle pins to the
         * corner. Side by side, the year, the gap and the 36px toggle ate 155 of
         * a 301px card on a phone, leaving the text a 96px column — every title
         * broke onto three lines and the card ran to 416px tall.
         */}
        <div className="relative flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:gap-8 sm:p-8">
          {/* Ghost year — white on the ember ground, since orange would vanish */}
          <span
            className={cn(
              "font-mono font-bold leading-none tracking-tighter transition-colors duration-500 sm:shrink-0",
              "text-4xl sm:text-5xl lg:text-6xl",
              open ? "text-white/90" : "text-white/10 group-hover:text-white/25"
            )}
          >
            {startYear(entry.period)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors duration-500",
                  open ? "border-white/30 text-white/90" : "border-white/12 text-zinc-400"
                )}
              >
                <Icon className="h-3 w-3" />
                {meta.label}
              </span>
              <span
                className={cn(
                  "font-mono text-[11px] transition-colors duration-500",
                  open ? "text-white/60" : "text-zinc-600"
                )}
              >
                {entry.period}
              </span>
            </div>

            <h3
              className={cn(
                "mt-3 text-xl font-semibold text-white transition-colors duration-300 sm:text-2xl",
                !open && "group-hover:text-brand-400"
              )}
            >
              {entry.title}
            </h3>

            <p
              className={cn(
                "mt-1 text-[13px] transition-colors duration-500",
                open ? "text-white/70" : "text-zinc-500"
              )}
            >
              {entry.org}
              {entry.location ? (
                <span className={open ? "text-white/50" : "text-zinc-600"}> · {entry.location}</span>
              ) : null}
            </p>

            <p
              className={cn(
                "mt-3 max-w-3xl text-sm leading-relaxed transition-colors duration-500",
                open ? "text-white/85" : "text-zinc-400"
              )}
            >
              {entry.summary}
            </p>

            {/* Detail */}
            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <ul className="mt-6 space-y-2.5 border-t border-white/20 pt-6">
                    {entry.highlights.map((highlight, i) => (
                      <motion.li
                        key={highlight}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i, duration: 0.35 }}
                        className="flex gap-3 text-[13px] leading-relaxed text-white/85"
                      >
                        <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-white/70" />
                        {highlight}
                      </motion.li>
                    ))}
                  </ul>

                  {entry.stack?.length ? (
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {entry.stack.map((tech) => (
                        <TechBadge key={tech} tone="ember">
                          {tech}
                        </TechBadge>
                      ))}
                    </div>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Expand affordance — white on ember, so it stays visible. Pinned to
              the corner on mobile so it shares the year's line instead of
              claiming a third row. */}
          <span
            className={cn(
              "absolute right-5 top-5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-500 sm:static",
              open
                ? "rotate-45 border-white bg-white text-brand-600"
                : "border-white/12 text-zinc-500 group-hover:border-white/30 group-hover:text-white"
            )}
          >
            <Plus className="h-4 w-4" />
          </span>
        </div>
      </button>
    </motion.li>
  );
}
