import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Route, Wallet } from "lucide-react";
import { DetailChrome } from "@/components/layout/detail-chrome";
import { Footer } from "@/components/layout/footer";
import { DownloadGuideButton, TripDetail } from "@/components/travel/trip-detail";
import { Aurora } from "@/components/fx/effects";
import { Badge } from "@/components/ui/primitives";
import { getProfile } from "@/lib/content/profile";
import { getTrips } from "@/lib/content/trips";
import { cn } from "@/lib/utils";

/** Prerender every itinerary at build time — the content is fully static. */
export async function generateStaticParams() {
  const trips = await getTrips();
  return trips.map((trip) => ({ slug: trip.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/travel/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const trips = await getTrips();
  const trip = trips.find((t) => t.slug === slug);

  if (!trip) return { title: "Trip not found" };

  const title = `${trip.destination} solo travel guide (${trip.days} days)`;
  const description = `${trip.hook} A day-by-day ${trip.days}-day itinerary for ${trip.destination}, ${trip.region} — route, gear, budget and solo travel notes.`;
  const profile = await getProfile();

  return {
    title,
    description,
    keywords: [
      `${trip.destination} itinerary`,
      `${trip.destination} solo travel`,
      `${trip.destination} travel guide`,
      "solo travel",
    ],
    openGraph: {
      type: "article",
      title: `${title} — ${profile.name}`,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TripPage({ params }: PageProps<"/travel/[slug]">) {
  const { slug } = await params;
  const trips = await getTrips();
  const index = trips.findIndex((t) => t.slug === slug);
  const trip = trips[index];

  if (!trip) notFound();

  const previous = trips[(index - 1 + trips.length) % trips.length];
  const next = trips[(index + 1) % trips.length];

  const vitals = [
    { icon: CalendarDays, label: "Duration", value: `${trip.days} days` },
    { icon: Route, label: "Distance", value: `${trip.distanceKm.toLocaleString()} km` },
    { icon: Wallet, label: "Budget", value: trip.budget },
    { icon: MapPin, label: "Coordinates", value: `${trip.lat.toFixed(2)}°, ${trip.lng.toFixed(2)}°` },
  ];

  return (
    <>
      <DetailChrome backHref="/#travel" backLabel="All journeys" />

      <main className="relative flex-1 pt-28">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <Aurora className="opacity-60" />

        <article className="relative mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
          {/* Hero plate */}
          <header
            className={cn(
              "relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br p-8 sm:p-10",
              trip.gradient
            )}
          >
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge accent="cyan">{trip.year}</Badge>
                <Badge accent="neutral">{trip.vibe}</Badge>
              </div>

              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {trip.destination}
              </h1>
              <p className="mt-1.5 text-sm text-zinc-400">{trip.region}</p>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-300">{trip.hook}</p>

              <div className="mt-6">
                <DownloadGuideButton trip={trip} />
              </div>
            </div>
          </header>

          {/* Vitals */}
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {vitals.map(({ icon: Icon, label, value }) => (
              <div key={label} className="glass rounded-xl p-4">
                <dt className="eyebrow flex items-center gap-1.5 text-zinc-500">
                  <Icon className="h-3 w-3" />
                  {label}
                </dt>
                <dd className="mt-2 font-mono text-sm font-semibold text-white">{value}</dd>
              </div>
            ))}
          </dl>

          {/* Guide — header suppressed, the hero plate above already carries it */}
          <div className="glass mt-4 rounded-2xl">
            <TripDetail trip={trip} showHeader={false} />
          </div>

          {/* Prev / next */}
          <nav className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href={`/travel/${previous.slug}`}
              className="glass group rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:border-white/25"
            >
              <span className="eyebrow flex items-center gap-1.5 text-zinc-500">
                <ArrowLeft className="h-3 w-3" />
                Previous
              </span>
              <span className="mt-2 block font-semibold text-white transition-colors group-hover:text-brand-200">
                {previous.destination}
              </span>
            </Link>

            <Link
              href={`/travel/${next.slug}`}
              className="glass group rounded-2xl p-5 text-right transition-all hover:-translate-y-0.5 hover:border-white/25"
            >
              <span className="eyebrow flex items-center justify-end gap-1.5 text-zinc-500">
                Next
                <ArrowRight className="h-3 w-3" />
              </span>
              <span className="mt-2 block font-semibold text-white transition-colors group-hover:text-brand-200">
                {next.destination}
              </span>
            </Link>
          </nav>
        </article>
      </main>

      <Footer />
    </>
  );
}
