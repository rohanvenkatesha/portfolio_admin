"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { ArrowUpRight, CalendarDays, MapPin, Route } from "lucide-react";
import type { GlobeMarker } from "@/components/three/globe";
import { Reveal, SectionHeading } from "@/components/fx/reveal";
import { CursorPreview } from "@/components/fx/cursor-preview";
import { trips as fallbackTrips, type Trip } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * The globe pulls in three.js, the heaviest dependency on the site. Loading it
 * on demand keeps it out of the first-load bundle.
 */
const Globe = dynamic(() => import("@/components/three/globe").then((m) => m.Globe), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-square w-full items-center justify-center">
      <div className="h-40 w-40 animate-pulse rounded-full border border-brand-500/20" />
    </div>
  ),
});

/** Trips come from the server (Firestore, or the repo as fallback). */
export function Travel({
  trips = fallbackTrips,
  totalCount,
}: {
  trips?: Trip[];
  /** Full collection size, when the list above is a truncated selection. */
  totalCount?: number;
}) {
  // Trips are deletable from the admin, so an empty list is a real state —
  // indexing [0] unguarded would crash the whole page.
  const [selectedId, setSelectedId] = useState(trips[0]?.id ?? "");
  const [hovered, setHovered] = useState<Trip | null>(null);

  const selected = useMemo(
    (): Trip | undefined => trips.find((trip) => trip.id === selectedId) ?? trips[0],
    [selectedId, trips]
  );

  // Markers are static — memoised so the globe effect never re-runs
  const markers = useMemo<GlobeMarker[]>(
    () =>
      trips.map((trip) => ({
        id: trip.id,
        lat: trip.lat,
        lng: trip.lng,
        label: trip.destination,
      })),
    [trips]
  );

  const handleSelect = useCallback((id: string) => setSelectedId(id), []);

  /**
   * Scrolling slides a row out from under a stationary cursor without firing
   * mouseleave, which would strand the preview card on screen. Clear it on any
   * scroll while a row is hovered.
   */
  useEffect(() => {
    if (!hovered) return;
    const clear = () => setHovered(null);
    window.addEventListener("scroll", clear, { passive: true });
    return () => window.removeEventListener("scroll", clear);
  }, [hovered]);


  // Nothing to render — better an honest empty state than a broken globe.
  if (trips.length === 0 || !selected) return null;

  return (
    <section id="travel" className="relative scroll-mt-24 px-3 py-3 sm:px-5 lg:px-6">
      <div className="relative mx-auto w-full max-w-[100rem] overflow-hidden rounded-[1.75rem] border border-white/8 bg-panel px-6 py-14 sm:px-10 sm:py-16 lg:px-14">
        <SectionHeading
          eyebrow="Solo Travel"
          title={
            <>
              Places I went
              <br />
              <span className="text-brand-500">on my own</span>
            </>
          }
          description={`${totalCount ?? trips.length} journeys on the map. Hover a destination to find it on the globe — open it for the full day-by-day guide.`}
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* ---------------- Globe ---------------- */}
          <Reveal direction="right" className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-panel-2 p-4">
              <Globe
                markers={markers}
                selectedId={selectedId}
                onSelect={handleSelect}
                className="aspect-square w-full"
              />

              <div className="pointer-events-none absolute left-6 top-6">
                <p className="eyebrow text-zinc-500">Drag to rotate</p>
              </div>

              {/* Live coordinate readout for the selected pin */}
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-none absolute bottom-6 right-6 text-right"
              >
                <p className="font-mono text-[11px] text-brand-400">{selected.destination}</p>
                <p className="font-mono text-[10px] text-zinc-600">
                  {selected.lat.toFixed(2)}°, {selected.lng.toFixed(2)}°
                </p>
              </motion.div>
            </div>
          </Reveal>

          {/* ---------------- Destination rows ---------------- */}
          <div className="border-t border-white/8">
            {trips.map((trip, index) => {
              const active = trip.id === selectedId;
              return (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  onMouseEnter={() => {
                    setHovered(trip);
                    handleSelect(trip.id);
                  }}
                  onMouseLeave={() => setHovered(null)}
                  className="border-b border-white/8"
                >
                  <Link
                    href={`/travel/${trip.slug}`}
                    className="group relative block overflow-hidden px-4 py-7"
                  >
                    {/* Orange wash wipes in from the left */}
                    <span
                      aria-hidden
                      className="absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-brand-500/12 to-transparent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                    />

                    <div className="relative flex items-center gap-5">
                      <span
                        className={cn(
                          "font-mono text-[11px] transition-colors duration-300",
                          active ? "text-brand-500" : "text-zinc-600"
                        )}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      {/* Content nudges right on hover */}
                      <div className="min-w-0 flex-1 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <h3 className="text-xl font-semibold text-white transition-colors duration-300 group-hover:text-brand-400 sm:text-2xl">
                            {trip.destination}
                          </h3>
                          <span className="font-mono text-[11px] text-zinc-600">{trip.year}</span>
                        </div>

                        <p className="mt-1 text-[13px] text-zinc-500">{trip.region}</p>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[11px] text-zinc-500">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3 w-3" />
                            {trip.days} days
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Route className="h-3 w-3" />
                            {trip.distanceKm.toLocaleString()} km
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3 w-3" />
                            {trip.vibe}
                          </span>
                        </div>
                      </div>

                      {/* Arrow slides in and rotates */}
                      {/* Hover-only, so on a phone it was 60px of a 269px row
                          reserved for something that can never appear. */}
                      <span className="hidden h-10 w-10 shrink-0 translate-x-3 items-center justify-center rounded-full border border-white/12 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0 group-hover:border-brand-500 group-hover:bg-brand-500 group-hover:opacity-100 sm:flex">
                        <ArrowUpRight className="h-4 w-4 text-white transition-transform duration-300 group-hover:rotate-45" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}

            {/* Only offered when the home page is actually holding items back */}
            {totalCount && totalCount > trips.length ? (
              <Link
                href="/travel"
                className="group flex items-center justify-between gap-4 px-4 py-6 transition-colors hover:text-brand-400"
              >
                <span className="text-sm font-semibold text-white transition-colors group-hover:text-brand-400">
                  View all {totalCount} journeys
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 transition-all duration-500 group-hover:border-brand-500 group-hover:bg-brand-500">
                  <ArrowUpRight className="h-4 w-4 text-white transition-transform duration-300 group-hover:rotate-45" />
                </span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Preview card trailing the cursor while a row is hovered */}
      <CursorPreview visible={hovered !== null} className="w-64">
        {hovered ? (
          <div className={cn("relative aspect-[4/3] bg-gradient-to-br", hovered.gradient)}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-base font-semibold text-white">{hovered.destination}</p>
              <p className="mt-0.5 font-mono text-[10px] text-brand-300">
                {hovered.days} days · {hovered.distanceKm.toLocaleString()} km
              </p>
            </div>
          </div>
        ) : null}
      </CursorPreview>
    </section>
  );
}
