"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Backpack, ChevronDown, Download, Lightbulb, Route } from "lucide-react";
import type { Trip } from "@/content/site";
import { cn } from "@/lib/utils";

type Tab = "itinerary" | "gear" | "tips";

const TABS: { id: Tab; label: string; icon: typeof Route }[] = [
  { id: "itinerary", label: "Itinerary", icon: Route },
  { id: "gear", label: "Gear", icon: Backpack },
  { id: "tips", label: "Solo tips", icon: Lightbulb },
];

/** Build a portable markdown guide for a trip and hand it to the browser. */
export function downloadItinerary(trip: Trip) {
  const lines = [
    `# ${trip.destination} — ${trip.year}`,
    ``,
    `${trip.region} · ${trip.days} days · ${trip.distanceKm.toLocaleString()} km · ${trip.budget}`,
    ``,
    `> ${trip.hook}`,
    ``,
    `## Day by day`,
    ``,
    ...trip.itinerary.flatMap((day) => [`### ${day.day} — ${day.title}`, ``, day.detail, ``]),
    `## Gear carried`,
    ``,
    ...trip.gear.map((item) => `- ${item}`),
    ``,
    `## Solo travel notes`,
    ``,
    ...trip.tips.map((tip) => `- ${tip}`),
    ``,
    `## Reflection`,
    ``,
    trip.reflection.trim(),
    ``,
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${trip.slug}-itinerary.md`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/** Standalone download control, for pages that render their own trip header. */
export function DownloadGuideButton({ trip }: { trip: Trip }) {
  return (
    <button
      onClick={() => downloadItinerary(trip)}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:border-brand-400/50 hover:bg-brand-400/10 hover:text-brand-200"
    >
      <Download className="h-3.5 w-3.5" />
      Download guide
    </button>
  );
}

/**
 * Tabbed trip guide: day-by-day log, gear list and solo-travel notes.
 *
 * Shared by the travel section on the home page and the standalone
 * /travel/[slug] route, so both stay in sync automatically.
 */
export function TripDetail({
  trip,
  showHeader = true,
  className,
}: {
  trip: Trip;
  showHeader?: boolean;
  className?: string;
}) {
  const [tab, setTab] = useState<Tab>("itinerary");
  const [openDay, setOpenDay] = useState<string | null>(trip.itinerary[0]?.day ?? null);

  return (
    <div className={cn("overflow-hidden", className)}>
      {showHeader ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-6">
          <div>
            <h3 className="text-2xl font-bold text-white">
              {trip.destination}
              <span className="ml-3 font-mono text-sm font-normal text-zinc-500">{trip.year}</span>
            </h3>
            <p className="mt-1 text-sm text-zinc-500">{trip.region}</p>
          </div>

          <button
            onClick={() => downloadItinerary(trip)}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-white transition-all hover:border-brand-400/50 hover:bg-brand-400/10 hover:text-brand-200"
          >
            <Download className="h-3.5 w-3.5" />
            Download guide
          </button>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10 px-6 pt-4">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {active ? (
                <motion.span
                  layoutId={`travel-tab-${trip.id}`}
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-brand-400 to-brand-400"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Tab body */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${trip.id}-${tab}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === "itinerary" ? (
              <div className="space-y-2.5">
                {trip.itinerary.map((day) => {
                  const open = openDay === day.day;
                  return (
                    <div
                      key={day.day}
                      className={cn(
                        "overflow-hidden rounded-xl border transition-colors",
                        open
                          ? "border-brand-400/30 bg-brand-400/[0.04]"
                          : "border-white/10 bg-white/[0.02]"
                      )}
                    >
                      <button
                        onClick={() => setOpenDay(open ? null : day.day)}
                        aria-expanded={open}
                        className="flex w-full items-center justify-between gap-4 p-4 text-left"
                      >
                        <span className="flex min-w-0 items-center gap-4">
                          <span className="shrink-0 font-mono text-[11px] text-brand-300">
                            {day.day}
                          </span>
                          <span className="truncate text-sm font-medium text-white">
                            {day.title}
                          </span>
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-300",
                            open && "rotate-180"
                          )}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {open ? (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <p className="px-4 pb-4 text-sm leading-relaxed text-zinc-400 sm:pl-[5.5rem]">
                              {day.detail}
                            </p>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {tab === "gear" ? (
              <div className="flex flex-wrap gap-2">
                {trip.gear.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-brand-400/40 hover:text-brand-200"
                  >
                    <Backpack className="h-3.5 w-3.5 text-zinc-600" />
                    {item}
                  </span>
                ))}
              </div>
            ) : null}

            {tab === "tips" ? (
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {trip.tips.map((tip) => (
                  <li
                    key={tip}
                    className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-4 text-sm leading-relaxed text-zinc-300"
                  >
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                    {tip}
                  </li>
                ))}
              </ul>
            ) : null}
          </motion.div>
        </AnimatePresence>

        <blockquote className="mt-7 border-l-2 border-brand-400/40 pl-5 text-sm italic leading-relaxed text-zinc-400">
          {trip.reflection}
        </blockquote>
      </div>
    </div>
  );
}
