"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, LayoutGrid, X } from "lucide-react";
import { Reveal } from "@/components/fx/reveal";
import type { Waypoint } from "@/content/posts";
import { cn } from "@/lib/utils";

/** Leaflet touches window on import, so the map is client-only. */
const RouteMap = dynamic(() =>
  import("@/components/travel/route-map").then((m) => m.RouteMap)
);

/**
 * The route: a map you step through one stop at a time.
 *
 * Three layouts came before this and all three had the same flaw — they listed
 * every stop, so their size grew with the route. Rows under the map, cards
 * under the map, then a rail inside it: fine at three stops, unusable at
 * twenty, where the rail becomes a scrollbar over the map and the phone strip
 * becomes an endless sideways scroll.
 *
 * This control is a fixed size at any length. One stop is shown at a time with
 * arrows either side, and the map flies to it. The full set is still reachable
 * — the index button opens a grid of numbers, which stays compact at twenty
 * because a number is two characters wide and a place name is not.
 *
 * The pins on the map were always the real list. This just walks them.
 */
export function PostRoute({ waypoints }: { waypoints: Waypoint[] }) {
  const [active, setActive] = useState(0);
  const [indexOpen, setIndexOpen] = useState(false);

  if (waypoints.length === 0) return null;

  const total = waypoints.length;
  const stop = waypoints[active];
  // Wraps, so walking off the end of a route returns to its start rather than
  // dead-ending on a disabled button.
  const go = (next: number) => setActive((next + total) % total);

  return (
    <Reveal direction="up">
      <div className="relative">
        <RouteMap
          waypoints={waypoints}
          focusIndex={active}
          className="h-[26rem] sm:h-[32rem] lg:h-[36rem]"
        />

        {/* Above Leaflet's panes and the map's own HUD, and transparent to the
            pointer except on the control itself so the map still drags. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[700] p-2.5 sm:p-3">
          <div className="pointer-events-auto overflow-hidden rounded-sm border border-white/12 bg-void/80 backdrop-blur-md">
            <div className="flex items-stretch">
              <StepButton label="Previous stop" onClick={() => go(active - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </StepButton>

              <div className="min-w-0 flex-1 px-3 py-2.5 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  <span className="text-brand-500">{String(active + 1).padStart(2, "0")}</span>
                  {" / "}
                  {String(total).padStart(2, "0")}
                </p>
                <p className="mt-0.5 truncate text-[13.5px] font-semibold text-white">
                  {stop.name}
                </p>
                {/* Third line only where there is height to spare — on a phone
                    the map is 416px and the bar was taking a quarter of it. */}
                {stop.note ? (
                  <p className="mt-0.5 hidden truncate text-[11.5px] text-zinc-400 sm:block">
                    {stop.note}
                  </p>
                ) : null}
              </div>

              <StepButton label="Next stop" onClick={() => go(active + 1)}>
                <ChevronRight className="h-4 w-4" />
              </StepButton>

              {/* Only worth offering when stepping would be tedious. */}
              {total > 3 ? (
                <StepButton
                  label={indexOpen ? "Close stop index" : "All stops"}
                  onClick={() => setIndexOpen((open) => !open)}
                  bordered
                >
                  {indexOpen ? <X className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                </StepButton>
              ) : null}
            </div>

            {/* Numbers only, so twenty stops stay a couple of tidy rows rather
                than a scrolling list of place names. */}
            {indexOpen ? (
              <ol className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto border-t border-white/10 p-2.5">
                {waypoints.map((waypoint, i) => (
                  <li key={`${waypoint.name}-${i}`}>
                    <button
                      type="button"
                      title={waypoint.name}
                      aria-current={i === active ? "true" : undefined}
                      onClick={() => {
                        setActive(i);
                        setIndexOpen(false);
                      }}
                      className={cn(
                        "rounded-sm border px-2 py-1 font-mono text-[10px] tabular-nums transition-colors",
                        i === active
                          ? "border-brand-500 bg-brand-500/15 text-brand-300"
                          : "border-white/10 text-zinc-500 hover:border-white/30 hover:text-zinc-200"
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </button>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function StepButton({
  label,
  onClick,
  bordered,
  children,
}: {
  label: string;
  onClick: () => void;
  bordered?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex shrink-0 items-center justify-center px-3 text-zinc-400 transition-colors hover:bg-white/8 hover:text-brand-400",
        bordered && "border-l border-white/10"
      )}
    >
      {children}
    </button>
  );
}
