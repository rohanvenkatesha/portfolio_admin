import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { DetailChrome } from "@/components/layout/detail-chrome";
import { Footer } from "@/components/layout/footer";
import { PostBlocks } from "@/components/travel/post-blocks";
import { RiderLinks } from "@/components/travel/rider-links";
import { Aurora } from "@/components/fx/effects";
import { getProfile } from "@/lib/content/profile";
import { getTrips } from "@/lib/content/trips";
import { getPost, getPosts } from "@/lib/content/posts";

/** Leaflet touches window on import, so the map is client-only. */
const RouteMap = dynamic(() =>
  import("@/components/travel/route-map").then((m) => m.RouteMap)
);

/**
 * Only published posts get a prerendered path. A draft therefore 404s rather
 * than sitting on a guessable URL, which is the whole point of the flag.
 */
export async function generateStaticParams() {
  const [trips, posts] = await Promise.all([getTrips(), getPosts()]);

  return posts.flatMap((post) => {
    const trip = trips.find((t) => t.id === post.tripId);
    return trip ? [{ slug: trip.slug, post: post.slug }] : [];
  });
}

async function resolve(slug: string, postSlug: string) {
  const trips = await getTrips();
  const trip = trips.find((t) => t.slug === slug);
  if (!trip) return null;

  const post = await getPost(trip.id, postSlug);
  return post ? { trip, post, trips } : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/travel/[slug]/[post]">): Promise<Metadata> {
  const { slug, post: postSlug } = await params;
  const found = await resolve(slug, postSlug);
  if (!found) return { title: "Post not found" };

  const profile = await getProfile();
  const description = found.post.excerpt || `A write-up from ${found.trip.destination}.`;

  return {
    title: found.post.title,
    description,
    openGraph: {
      type: "article",
      title: `${found.post.title} — ${profile.name}`,
      description,
      publishedTime: found.post.date || undefined,
    },
    twitter: { card: "summary_large_image", title: found.post.title, description },
  };
}

export default async function TripPostPage({ params }: PageProps<"/travel/[slug]/[post]">) {
  const { slug, post: postSlug } = await params;
  const found = await resolve(slug, postSlug);
  if (!found) notFound();

  const { trip, post, trips } = found;

  const siblings = (await getPosts()).filter((p) => p.tripId === trip.id);
  const index = siblings.findIndex((p) => p.id === post.id);
  const previous = index > 0 ? siblings[index - 1] : null;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;

  const related = post.relatedTripIds
    .map((id) => trips.find((t) => t.id === id))
    .filter((t): t is (typeof trips)[number] => Boolean(t) && t!.id !== trip.id);

  return (
    <>
      <DetailChrome backHref={`/travel/${trip.slug}`} backLabel={trip.destination} />

      <main className="relative flex-1 pb-3 pt-28">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <Aurora className="opacity-50" />

        <article className="relative mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
          {/* ---------------- Header ---------------- */}
          <header>
            <Link
              href={`/travel/${trip.slug}`}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] text-brand-400 transition-colors hover:text-brand-300"
            >
              <MapPin className="h-3 w-3" />
              {trip.destination}
            </Link>

            <h1 className="mt-4 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl">
              {post.title}
            </h1>

            {post.excerpt ? (
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-300">{post.excerpt}</p>
            ) : null}

            {post.date ? (
              <p className="mt-5 inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
                <CalendarDays className="h-3 w-3" />
                <time dateTime={post.date}>
                  {new Date(`${post.date}T00:00:00Z`).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </time>
              </p>
            ) : null}
          </header>

          {post.coverUrl ? (
            <div className="relative mt-8 aspect-[21/9] w-full overflow-hidden rounded-2xl border border-white/10 bg-panel-2">
              <Image
                src={post.coverUrl}
                alt=""
                fill
                priority
                sizes="(max-width: 896px) 100vw, 896px"
                className="object-cover"
              />
            </div>
          ) : null}

          {/* ---------------- Stats ---------------- */}
          {post.stats.length ? (
            <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {post.stats.map((stat) => (
                <div key={stat.label} className="glass rounded-xl p-4">
                  <dt className="eyebrow text-[10px] text-zinc-500">{stat.label}</dt>
                  <dd className="mt-2 font-mono text-lg font-semibold text-white">{stat.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {/* ---------------- Route ---------------- */}
          {post.route.length ? (
            <section className="mt-10">
              <h2 className="text-sm font-semibold text-white">The route</h2>
              <p className="mt-1 text-[12px] text-zinc-500">
                {post.route.length} {post.route.length === 1 ? "stop" : "stops"} — tap a pin for
                details. Click the map to enable scroll zoom.
              </p>
              <div className="mt-4">
                <RouteMap waypoints={post.route} />
              </div>

              <ol className="mt-4 grid gap-2 sm:grid-cols-2">
                {post.route.map((stop, i) => (
                  <li
                    key={`${stop.name}-${i}`}
                    className="flex gap-3 rounded-xl border border-white/8 bg-panel-2 p-3.5"
                  >
                    <span className="ember-fill-hot mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-white">{stop.name}</span>
                      {stop.note ? (
                        <span className="mt-0.5 block text-[12px] leading-relaxed text-zinc-500">
                          {stop.note}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* ---------------- Body ---------------- */}
          <div className="mt-12">
            <PostBlocks blocks={post.blocks} />
          </div>

          {/* ---------------- Riders ---------------- */}
          {post.riders.length ? (
            <section className="mt-14">
              <h2 className="text-sm font-semibold text-white">Rode with</h2>
              <div className="mt-4">
                <RiderLinks riders={post.riders} />
              </div>
            </section>
          ) : null}

          {/* ---------------- Related trips ---------------- */}
          {related.length ? (
            <section className="mt-14">
              <h2 className="text-sm font-semibold text-white">Related journeys</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {related.map((other) => (
                  <Link
                    key={other.id}
                    href={`/travel/${other.slug}`}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-panel-2 p-5 transition-colors hover:border-brand-500/40"
                  >
                    <span className="min-w-0">
                      <span className="eyebrow block text-[10px] text-brand-400">{other.year}</span>
                      <span className="mt-1 block font-semibold text-white">
                        {other.destination}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-zinc-500">{other.region}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-600 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-400" />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {/* ---------------- Prev / next within this trip ---------------- */}
          {previous || next ? (
            <nav className="mt-14 grid gap-3 sm:grid-cols-2">
              {previous ? (
                <Link
                  href={`/travel/${trip.slug}/${previous.slug}`}
                  className="glass group rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:border-white/25"
                >
                  <span className="eyebrow flex items-center gap-1.5 text-zinc-500">
                    <ArrowLeft className="h-3 w-3" />
                    Previous
                  </span>
                  <span className="mt-2 block font-semibold text-white transition-colors group-hover:text-brand-200">
                    {previous.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}

              {next ? (
                <Link
                  href={`/travel/${trip.slug}/${next.slug}`}
                  className="glass group rounded-2xl p-5 text-right transition-all hover:-translate-y-0.5 hover:border-white/25 sm:col-start-2"
                >
                  <span className="eyebrow flex items-center justify-end gap-1.5 text-zinc-500">
                    Next
                  </span>
                  <span className="mt-2 block font-semibold text-white transition-colors group-hover:text-brand-200">
                    {next.title}
                  </span>
                </Link>
              ) : null}
            </nav>
          ) : null}
        </article>
      </main>

      <Footer />
    </>
  );
}
