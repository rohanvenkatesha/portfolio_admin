import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, Route } from "lucide-react";
import { DetailChrome } from "@/components/layout/detail-chrome";
import { Footer } from "@/components/layout/footer";
import { getTrips } from "@/lib/content/trips";
import { getProfile } from "@/lib/content/profile";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();

  return {
    title: "Solo travel guides",
    description: `Every solo journey ${profile.name} has documented — day-by-day itineraries, gear lists, budgets and route notes.`,
  };
}

/**
 * The full travel archive.
 *
 * A plain responsive grid rather than the home page's globe-and-rows layout:
 * this has to stay readable at three entries or three hundred, and the globe
 * only makes sense alongside a short, curated list.
 */
export default async function TravelIndexPage() {
  const trips = await getTrips();

  const totals = {
    days: trips.reduce((sum, t) => sum + t.days, 0),
    km: trips.reduce((sum, t) => sum + t.distanceKm, 0),
  };

  return (
    <>
      <DetailChrome backHref="/#travel" backLabel="Back to portfolio" />

      <main className="relative flex-1 px-3 pt-28 sm:px-5 lg:px-6">
        <div className="mx-auto w-full max-w-[100rem]">
          <header className="rounded-[1.75rem] border border-white/8 bg-panel px-6 py-14 sm:px-10 lg:px-14">
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              <span className="eyebrow text-brand-500">Archive</span>
            </div>

            <h1 className="mt-4 max-w-3xl text-balance text-3xl font-bold leading-[1.06] tracking-tight text-white sm:text-4xl lg:text-5xl">
              Every journey,
              <br />
              <span className="text-brand-500">start to finish</span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              {trips.length} {trips.length === 1 ? "journey" : "journeys"} · {totals.days} days on
              the road · roughly {totals.km.toLocaleString()} km. Each one opens into a full
              day-by-day guide with gear, budget and notes.
            </p>
          </header>

          {trips.length === 0 ? (
            <p className="mt-3 rounded-[1.75rem] border border-white/8 bg-panel px-6 py-20 text-center text-sm text-zinc-500">
              No journeys published yet.
            </p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {trips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/travel/${trip.slug}`}
                  className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-white/8 p-6"
                >
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br transition-transform duration-700 ease-out group-hover:scale-105",
                      trip.gradient
                    )}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                  <div className="relative">
                    <span className="eyebrow text-[10px] text-brand-400">{trip.year}</span>
                    <h2 className="mt-1.5 text-2xl font-semibold text-white">{trip.destination}</h2>
                    <p className="mt-1 text-[12px] text-zinc-400">{trip.region}</p>

                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[11px] text-zinc-400">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3 w-3" />
                        {trip.days}d
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

                  <span className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100">
                    <ArrowUpRight className="h-4 w-4 text-white" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
