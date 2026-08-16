import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { DetailChrome } from "@/components/layout/detail-chrome";
import { Footer } from "@/components/layout/footer";
import { PostBlocks } from "@/components/travel/post-blocks";
import { PostGallery } from "@/components/travel/post-gallery";
import { RiderLinks } from "@/components/travel/rider-links";
import { EmberBackdrop } from "@/components/fx/ember-backdrop";
import { Reveal, RevealGroup, RevealItem, SectionHeading } from "@/components/fx/reveal";
import { getProfile } from "@/lib/content/profile";
import { getTrips } from "@/lib/content/trips";
import { getPost, getPosts } from "@/lib/content/posts";
import { collectImages } from "@/content/posts";
import { cn } from "@/lib/utils";

/** Leaflet touches window on import, so the map is client-only. */
const RouteMap = dynamic(() =>
  import("@/components/travel/route-map").then((m) => m.RouteMap)
);

const EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]";

/**
 * A post is laid out as the home page is: a stack of full-width panels, each
 * opening with a SectionHeading, separated by the same 12px gutters. The
 * previous version used a sticky rail beside a narrow article — a shape that
 * appears nowhere else on this site, which is what made it read as a different
 * page however closely the details were matched.
 */
const SECTION = "relative px-3 py-3 sm:px-5 lg:px-6";
const PANEL =
  "relative mx-auto w-full max-w-[100rem] overflow-hidden rounded-[1.75rem] border border-white/8 bg-panel px-6 py-14 sm:px-10 sm:py-16 lg:px-14";

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

  // Every image in the body, in reading order, for the gallery section.
  const images = collectImages(post.blocks);

  const related = post.relatedTripIds
    .map((id) => trips.find((t) => t.id === id))
    .filter((t): t is (typeof trips)[number] => Boolean(t) && t!.id !== trip.id);

  return (
    <>
      <DetailChrome backHref={`/travel/${trip.slug}`} backLabel={trip.destination} />

      <main className="relative flex-1 pb-3 pt-24">
        {/* ================= Hero — the shape of the home page's ================= */}
        <section className={cn(SECTION, "pt-0")}>
          <div className="mx-auto w-full max-w-[100rem]">
            <div className="relative flex min-h-[clamp(20rem,52svh,30rem)] flex-col overflow-hidden rounded-[1.75rem] border border-white/8 bg-panel sm:rounded-[2.25rem]">
              <div className="absolute inset-0 bg-grid opacity-70" />

              {post.coverUrl ? (
                <Image
                  src={post.coverUrl}
                  alt=""
                  fill
                  priority
                  sizes="100vw"
                  className="z-[1] object-cover"
                />
              ) : (
                // No cover is a normal state, so the ember treatment stands in
                // rather than leaving a flat panel.
                <div className="absolute inset-0 z-[1]">
                  <EmberBackdrop />
                </div>
              )}

              <div className="absolute inset-0 z-[2] bg-gradient-to-t from-panel via-panel/60 to-panel/20" />
              <div className="absolute -left-40 top-1/3 z-[2] h-[34rem] w-[34rem] rounded-full bg-brand-600/12 blur-[130px]" />

              {/* Same two-tier masthead the hero uses: identity above, support
                  below, flowing from the top so spare height falls to the base
                  instead of opening a hole in the middle. */}
              <div className="relative z-10 flex flex-1 flex-col gap-10 p-6 sm:p-9 lg:gap-12 lg:p-12">
                <div>
                  <Reveal direction="up">
                    <Link
                      href={`/travel/${trip.slug}`}
                      className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-void/40 py-1.5 pl-3 pr-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-md transition-all duration-300 hover:border-brand-500 hover:bg-brand-500"
                    >
                      <MapPin className="h-3 w-3" />
                      {trip.destination}
                      <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:rotate-45" />
                    </Link>
                  </Reveal>

                  <Reveal direction="up" delay={0.08}>
                    <h1 className="display-name mt-6 max-w-[20ch] text-balance text-white [font-size:clamp(2rem,5vw,4.75rem)]">
                      {post.title}
                    </h1>
                  </Reveal>

                  {post.date ? (
                    <Reveal direction="up" delay={0.16}>
                      <div className="mt-5 flex items-center gap-3 text-base font-medium text-zinc-400 sm:text-lg">
                        <span className="h-px w-8 shrink-0 bg-brand-500" />
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-brand-500" />
                          <time dateTime={post.date}>{formatDate(post.date)}</time>
                        </span>
                      </div>
                    </Reveal>
                  ) : null}
                </div>

                {post.excerpt ? (
                  <Reveal direction="up" delay={0.24}>
                    <p className="max-w-2xl text-pretty text-sm leading-relaxed text-zinc-300 sm:text-base">
                      {post.excerpt}
                    </p>
                  </Reveal>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* ================= Numbers — the ember panel from Capabilities ======== */}
        {post.stats.length ? (
          <section className={SECTION}>
            <div className="relative mx-auto w-full max-w-[100rem] overflow-hidden rounded-[1.75rem] border border-white/8">
              <EmberBackdrop drift={false} />

              {/* Palette inverts on the warm ground — the orange accent would
                  disappear into it. */}
              <div className="relative px-6 py-14 sm:px-10 sm:py-16 lg:px-14">
                <SectionHeading
                  eyebrow="By the numbers"
                  tone="ember"
                  title={
                    <>
                      What it took
                      <br />
                      to get there
                    </>
                  }
                />

                <RevealGroup
                  className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                  stagger={0.08}
                >
                  {post.stats.map((stat) => (
                    <RevealItem key={stat.label}>
                      <div className="border-t border-white/25 pt-5">
                        <p className="font-mono text-4xl font-bold tracking-tight text-white sm:text-5xl">
                          {stat.value}
                        </p>
                        <p className="mt-2 text-[13px] leading-tight text-white/70">{stat.label}</p>
                      </div>
                    </RevealItem>
                  ))}
                </RevealGroup>
              </div>
            </div>
          </section>
        ) : null}

        {/* ================= The write-up ======================================= */}
        <section className={SECTION}>
          <div className={PANEL}>
            <SectionHeading
              eyebrow="The Write-up"
              title={
                <>
                  How it
                  <br />
                  <span className="text-brand-500">actually went</span>
                </>
              }
            />

            <div className="mt-12">
              <PostBlocks blocks={post.blocks} />
            </div>
          </div>
        </section>

        {/* ================= Gallery — every frame, bento-tiled ================= */}
        {images.length ? (
          <section className={SECTION}>
            <div className={PANEL}>
              <SectionHeading
                eyebrow="The Gallery"
                title={
                  <>
                    {images.length} frames,
                    <br />
                    <span className="text-brand-500">full size</span>
                  </>
                }
                description="Every photo from this leg. Click one to open the viewer — arrow keys move between them."
              />

              <div className="mt-12">
                <PostGallery images={images} />
              </div>
            </div>
          </section>
        ) : null}

        {/* ================= Route ==============================================
            Placed after the writing, not before it. Leading with a map asks you
            to study the geography before you know why it matters.
            ===================================================================== */}
        {post.route.length ? (
          <section className={SECTION}>
            <div className={PANEL}>
              <SectionHeading
                eyebrow="The Route"
                title={
                  <>
                    {post.route.length} {post.route.length === 1 ? "stop" : "stops"},
                    <br />
                    <span className="text-brand-500">start to finish</span>
                  </>
                }
                description="Drag to look around, or click the map to enable scroll zoom. Tap any pin for its note."
              />

              {/* Map full width, stops in a grid beneath.

                  One full-width row per stop was fine for three and unusable
                  for fifteen — the section became a scroll of near-identical
                  rows. Compact cards in a responsive grid stay legible at any
                  count, and the map above is doing the spatial work anyway. */}
              <Reveal direction="up" className="mt-12">
                <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-panel-2 p-3 sm:p-4">
                  <RouteMap
                    waypoints={post.route}
                    className="h-[20rem] sm:h-[26rem] lg:h-[32rem]"
                  />
                  <div className="pointer-events-none absolute left-6 top-6 sm:left-7 sm:top-7">
                    <p className="eyebrow text-zinc-500">Drag to explore</p>
                  </div>
                </div>
              </Reveal>

              <RevealGroup
                className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
                stagger={0.04}
              >
                {post.route.map((stop, i) => (
                  <RevealItem key={`${stop.name}-${i}`}>
                    <div className="group relative h-full overflow-hidden rounded-xl border border-white/8 bg-panel-2 transition-colors duration-300 hover:border-brand-500/40">
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-brand-500/12 to-transparent transition-transform duration-500",
                          EASE,
                          "group-hover:scale-x-100"
                        )}
                      />

                      <div className="relative flex gap-3 p-4">
                        <span className="ember-fill-hot mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold text-white">
                          {i + 1}
                        </span>

                        <div
                          className={cn(
                            "min-w-0 flex-1 transition-transform duration-500",
                            EASE,
                            "group-hover:translate-x-1"
                          )}
                        >
                          <p className="truncate text-[13.5px] font-semibold text-white transition-colors duration-300 group-hover:text-brand-400">
                            {stop.name}
                          </p>
                          {stop.note ? (
                            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-zinc-500">
                              {stop.note}
                            </p>
                          ) : null}
                          <p className="mt-2 font-mono text-[10px] text-zinc-600">
                            {stop.lat.toFixed(3)}°, {stop.lng.toFixed(3)}°
                          </p>
                        </div>
                      </div>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </section>
        ) : null}

        {/* ================= Riders ============================================= */}
        {post.riders.length ? (
          <section className={SECTION}>
            <div className={PANEL}>
              <SectionHeading
                eyebrow="Company"
                title={
                  <>
                    Who I
                    <br />
                    <span className="text-brand-500">rode with</span>
                  </>
                }
                description="The people who were there for it — follow along with them too."
              />

              <Reveal direction="up" delay={0.1} className="mt-12">
                <RiderLinks riders={post.riders} />
              </Reveal>
            </div>
          </section>
        ) : null}

        {/* ================= Related journeys =================================== */}
        {related.length ? (
          <section className={SECTION}>
            <div className={PANEL}>
              <SectionHeading
                eyebrow="Elsewhere"
                title={
                  <>
                    Other roads,
                    <br />
                    <span className="text-brand-500">other years</span>
                  </>
                }
              />

              <RevealGroup className="mt-12 border-t border-white/8" stagger={0.08}>
                {related.map((other, i) => (
                  <RevealItem key={other.id}>
                    <div className="border-b border-white/8">
                      <Link
                        href={`/travel/${other.slug}`}
                        className="group relative block overflow-hidden px-4 py-7"
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-brand-500/12 to-transparent transition-transform duration-500",
                            EASE,
                            "group-hover:scale-x-100"
                          )}
                        />

                        <div className="relative flex items-center gap-5">
                          <span className="font-mono text-[11px] text-zinc-600 transition-colors duration-300 group-hover:text-brand-500">
                            {String(i + 1).padStart(2, "0")}
                          </span>

                          <div
                            className={cn(
                              "min-w-0 flex-1 transition-transform duration-500",
                              EASE,
                              "group-hover:translate-x-2"
                            )}
                          >
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                              <h3 className="text-xl font-semibold text-white transition-colors duration-300 group-hover:text-brand-400 sm:text-2xl">
                                {other.destination}
                              </h3>
                              <span className="font-mono text-[11px] text-zinc-600">
                                {other.year}
                              </span>
                            </div>
                            <p className="mt-1 text-[13px] text-zinc-500">{other.region}</p>
                          </div>

                          <span
                            aria-hidden
                            className={cn(
                              "hidden h-10 w-10 shrink-0 translate-x-3 items-center justify-center rounded-full border border-white/12 opacity-0 transition-all duration-500 sm:flex",
                              EASE,
                              "group-hover:translate-x-0 group-hover:border-brand-500 group-hover:bg-brand-500 group-hover:opacity-100"
                            )}
                          >
                            <ArrowUpRight className="h-4 w-4 text-white transition-transform duration-300 group-hover:rotate-45" />
                          </span>
                        </div>
                      </Link>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </section>
        ) : null}

        {/* ================= Prev / next ======================================== */}
        {previous || next ? (
          <section className={SECTION}>
            <div className="mx-auto grid w-full max-w-[100rem] gap-3 sm:grid-cols-2">
              {previous ? (
                <Link
                  href={`/travel/${trip.slug}/${previous.slug}`}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-panel p-8 transition-all duration-300 hover:border-brand-500/40 sm:p-10"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-brand-500/12 to-transparent transition-transform duration-500",
                      EASE,
                      "group-hover:scale-x-100"
                    )}
                  />
                  <span className="relative">
                    <span className="eyebrow flex items-center gap-1.5 text-zinc-600">
                      <ArrowLeft className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-1" />
                      Previous
                    </span>
                    <span className="mt-3 block text-xl font-semibold text-white transition-colors duration-300 group-hover:text-brand-400 sm:text-2xl">
                      {previous.title}
                    </span>
                  </span>
                </Link>
              ) : (
                <span />
              )}

              {next ? (
                <Link
                  href={`/travel/${trip.slug}/${next.slug}`}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-panel p-8 text-right transition-all duration-300 hover:border-brand-500/40 sm:col-start-2 sm:p-10"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-0 origin-right scale-x-0 bg-gradient-to-l from-brand-500/12 to-transparent transition-transform duration-500",
                      EASE,
                      "group-hover:scale-x-100"
                    )}
                  />
                  <span className="relative">
                    <span className="eyebrow flex items-center justify-end gap-1.5 text-zinc-600">
                      Next
                      <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                    <span className="mt-3 block text-xl font-semibold text-white transition-colors duration-300 group-hover:text-brand-400 sm:text-2xl">
                      {next.title}
                    </span>
                  </span>
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </>
  );
}
