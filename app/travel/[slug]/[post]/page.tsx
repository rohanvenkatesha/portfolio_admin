import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, MapPin, Route } from "lucide-react";
import { DetailChrome } from "@/components/layout/detail-chrome";
import { Footer } from "@/components/layout/footer";
import { PostBlocks } from "@/components/travel/post-blocks";
import { RiderLinks } from "@/components/travel/rider-links";
import { EmberBackdrop } from "@/components/fx/ember-backdrop";
import { Reveal } from "@/components/fx/reveal";
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

function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
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

      <main className="relative flex-1 pb-3 pt-24">
        {/* ------------------------------------------------------------------
            Masthead — a full-bleed plate the title sits inside rather than
            above. This is the one moment on the page that gets to be loud, and
            it's what stops a post reading like a generic article page.
            ------------------------------------------------------------------ */}
        <section className="px-3 sm:px-5 lg:px-6">
          <div className="relative mx-auto w-full max-w-[100rem] overflow-hidden rounded-[1.75rem] border border-white/8 bg-panel sm:rounded-[2.25rem]">
            {post.coverUrl ? (
              <Image
                src={post.coverUrl}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            ) : (
              // No cover is a normal state, so the ember treatment stands in
              // rather than leaving a flat panel.
              <EmberBackdrop />
            )}

            {/* Scrim: heavy at the base where the type sits, clearing upward so
                the photo still reads as a photo. */}
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/75 to-void/25" />

            <div className="relative flex min-h-[clamp(21rem,60svh,32rem)] flex-col justify-end p-6 sm:p-10 lg:p-14">
              <Reveal direction="up">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Link
                    href={`/travel/${trip.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-void/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-md transition-colors hover:border-brand-400 hover:text-brand-200"
                  >
                    <MapPin className="h-3 w-3" />
                    {trip.destination}
                  </Link>

                  {post.date ? (
                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-white/70">
                      <CalendarDays className="h-3 w-3" />
                      <time dateTime={post.date}>{formatDate(post.date)}</time>
                    </span>
                  ) : null}
                </div>
              </Reveal>

              <Reveal direction="up" delay={0.08}>
                {/* Fluid down to phones so the masthead scales rather than
                    wrapping into four cramped lines. */}
                <h1 className="display-name mt-6 max-w-[22ch] text-balance text-white [font-size:clamp(2.1rem,5.4vw,5rem)]">
                  {post.title}
                </h1>
              </Reveal>

              {post.excerpt ? (
                <Reveal direction="up" delay={0.16}>
                  <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-white/75 sm:text-lg">
                    {post.excerpt}
                  </p>
                </Reveal>
              ) : null}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------
            Body — a rail of facts beside the writing.

            The rail sticks on `lg` so the stats and route stay with you through
            a long post; below that it stacks above the prose, where a sticky
            element would just eat the screen.
            ------------------------------------------------------------------ */}
        <section className="mt-3 px-3 sm:px-5 lg:px-6">
          <div className="mx-auto grid w-full max-w-[100rem] gap-3 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
            {/* ---------------- Rail ---------------- */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="space-y-3">
                {post.stats.length ? (
                  <div className="rounded-2xl border border-white/8 bg-panel p-5">
                    <p className="eyebrow text-zinc-600">By the numbers</p>
                    <dl className="mt-4 space-y-3.5">
                      {post.stats.map((stat) => (
                        <div
                          key={stat.label}
                          className="flex items-baseline justify-between gap-4 border-b border-white/8 pb-3.5 last:border-0 last:pb-0"
                        >
                          <dt className="text-[12px] text-zinc-500">{stat.label}</dt>
                          <dd className="font-mono text-lg font-bold text-white">{stat.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : null}

                {post.route.length ? (
                  <div className="rounded-2xl border border-white/8 bg-panel p-5">
                    <p className="eyebrow flex items-center gap-1.5 text-zinc-600">
                      <Route className="h-3 w-3" />
                      {post.route.length} {post.route.length === 1 ? "stop" : "stops"}
                    </p>

                    <ol className="mt-4 space-y-0">
                      {post.route.map((stop, i) => (
                        <li key={`${stop.name}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
                          {/* Connector drawn between pins, skipped on the last */}
                          {i < post.route.length - 1 ? (
                            <span
                              aria-hidden
                              className="absolute bottom-0 left-[11px] top-6 w-px bg-white/12"
                            />
                          ) : null}

                          <span className="ember-fill-hot relative z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-bold text-white">
                            {i + 1}
                          </span>

                          <span className="min-w-0 pt-0.5">
                            <span className="block text-[13px] font-medium text-white">
                              {stop.name}
                            </span>
                            {stop.note ? (
                              <span className="mt-0.5 block text-[11.5px] leading-relaxed text-zinc-500">
                                {stop.note}
                              </span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                {post.riders.length ? (
                  <div className="rounded-2xl border border-white/8 bg-panel p-5">
                    <p className="eyebrow text-zinc-600">Rode with</p>
                    <div className="mt-4">
                      <RiderLinks riders={post.riders} />
                    </div>
                  </div>
                ) : null}
              </div>
            </aside>

            {/* ---------------- Article ---------------- */}
            <article className="rounded-2xl border border-white/8 bg-panel px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
              {post.route.length ? (
                <Reveal direction="up" className="mb-12">
                  <div className="overflow-hidden rounded-2xl border border-white/10">
                    <RouteMap waypoints={post.route} className="rounded-none border-0" />
                  </div>
                  <p className="mt-2.5 text-[11px] text-zinc-600">
                    Tap a pin for details. Click the map to enable scroll zoom.
                  </p>
                </Reveal>
              ) : null}

              <PostBlocks blocks={post.blocks} />

              {/* ---------------- Related journeys ---------------- */}
              {related.length ? (
                <section className="mt-16 border-t border-white/8 pt-10">
                  <h2 className="eyebrow text-zinc-600">Related journeys</h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {related.map((other) => (
                      <Link
                        key={other.id}
                        href={`/travel/${other.slug}`}
                        className="group flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-panel-2 p-5 transition-colors hover:border-brand-500/40"
                      >
                        <span className="min-w-0">
                          <span className="eyebrow block text-[10px] text-brand-400">
                            {other.year}
                          </span>
                          <span className="mt-1 block font-semibold text-white">
                            {other.destination}
                          </span>
                          <span className="mt-0.5 block text-[12px] text-zinc-500">
                            {other.region}
                          </span>
                        </span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-600 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-400" />
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {/* ---------------- Prev / next ---------------- */}
              {previous || next ? (
                <nav className="mt-12 grid gap-3 sm:grid-cols-2">
                  {previous ? (
                    <Link
                      href={`/travel/${trip.slug}/${previous.slug}`}
                      className="group rounded-2xl border border-white/8 bg-panel-2 p-5 transition-all hover:-translate-y-0.5 hover:border-white/25"
                    >
                      <span className="eyebrow flex items-center gap-1.5 text-zinc-600">
                        <ArrowLeft className="h-3 w-3" />
                        Previous
                      </span>
                      <span className="mt-2 block font-semibold text-white transition-colors group-hover:text-brand-400">
                        {previous.title}
                      </span>
                    </Link>
                  ) : (
                    <span />
                  )}

                  {next ? (
                    <Link
                      href={`/travel/${trip.slug}/${next.slug}`}
                      className="group rounded-2xl border border-white/8 bg-panel-2 p-5 text-right transition-all hover:-translate-y-0.5 hover:border-white/25 sm:col-start-2"
                    >
                      <span className="eyebrow flex items-center justify-end gap-1.5 text-zinc-600">
                        Next
                        <ArrowRight className="h-3 w-3" />
                      </span>
                      <span className="mt-2 block font-semibold text-white transition-colors group-hover:text-brand-400">
                        {next.title}
                      </span>
                    </Link>
                  ) : null}
                </nav>
              ) : null}
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
