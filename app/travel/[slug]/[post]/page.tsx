import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { DetailChrome } from "@/components/layout/detail-chrome";
import { Footer } from "@/components/layout/footer";
import { PostBlocks } from "@/components/travel/post-blocks";
import { RiderLinks } from "@/components/travel/rider-links";
import { EmberBackdrop } from "@/components/fx/ember-backdrop";
import { Reveal, RevealGroup, RevealItem } from "@/components/fx/reveal";
import { getProfile } from "@/lib/content/profile";
import { getTrips } from "@/lib/content/trips";
import { getPost, getPosts } from "@/lib/content/posts";
import { cn } from "@/lib/utils";

/** Leaflet touches window on import, so the map is client-only. */
const RouteMap = dynamic(() =>
  import("@/components/travel/route-map").then((m) => m.RouteMap)
);

const EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]";

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

/** The dot-and-label pairing that opens every section on the home page. */
function Eyebrow({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "ember" }) {
  const onEmber = tone === "ember";
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn("h-1.5 w-1.5 rounded-full", onEmber ? "bg-white" : "bg-brand-500")} />
      <span className={cn("eyebrow", onEmber ? "text-white/80" : "text-brand-500")}>{children}</span>
    </div>
  );
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
            above. The one moment on the page that gets to be loud.
            ------------------------------------------------------------------ */}
        <section className="px-3 sm:px-5 lg:px-6">
          <div className="relative mx-auto w-full max-w-[100rem] overflow-hidden rounded-[1.75rem] border border-white/8 bg-panel sm:rounded-[2.25rem]">
            {post.coverUrl ? (
              <Image src={post.coverUrl} alt="" fill priority sizes="100vw" className="object-cover" />
            ) : (
              // No cover is a normal state, so the ember treatment stands in
              // rather than leaving a flat panel.
              <EmberBackdrop />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/75 to-void/25" />

            <div className="relative flex min-h-[clamp(21rem,60svh,32rem)] flex-col justify-end p-6 sm:p-10 lg:p-14">
              <Reveal direction="up">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Link
                    href={`/travel/${trip.slug}`}
                    className={cn(
                      "group inline-flex items-center gap-2 rounded-full border border-white/20 bg-void/40 py-1.5 pl-3 pr-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-md transition-all duration-300",
                      "hover:border-brand-500 hover:bg-brand-500"
                    )}
                  >
                    <MapPin className="h-3 w-3" />
                    {trip.destination}
                    <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:rotate-45" />
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
            Body — a rail of facts beside the writing. Sticky on `lg`; stacked
            below that, where a sticky element would just eat the screen.
            ------------------------------------------------------------------ */}
        <section className="mt-3 px-3 sm:px-5 lg:px-6">
          <div className="mx-auto grid w-full max-w-[100rem] gap-3 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            {/* ---------------- Rail ---------------- */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="space-y-3">
                {post.stats.length ? (
                  /**
                   * The numbers carry the ember treatment, exactly as the stats
                   * panel does under the hero on the home page. Palette inverts
                   * to white — the orange accent would vanish into the ground.
                   */
                  <Reveal direction="right">
                    <div className="relative overflow-hidden rounded-2xl border border-white/8">
                      <EmberBackdrop drift={false} />

                      <div className="relative p-6">
                        <Eyebrow tone="ember">By the numbers</Eyebrow>

                        <dl className="mt-5 space-y-4">
                          {post.stats.map((stat) => (
                            <div
                              key={stat.label}
                              className="flex items-baseline justify-between gap-4 border-b border-white/20 pb-4 last:border-0 last:pb-0"
                            >
                              <dt className="text-[12px] text-white/70">{stat.label}</dt>
                              <dd className="font-mono text-2xl font-bold tracking-tight text-white">
                                {stat.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  </Reveal>
                ) : null}

                {post.route.length ? (
                  <Reveal direction="right" delay={0.08}>
                    <div className="rounded-2xl border border-white/8 bg-panel p-6">
                      <Eyebrow>
                        {post.route.length} {post.route.length === 1 ? "stop" : "stops"}
                      </Eyebrow>

                      {/* Numbered rows with the orange wipe, the same rhythm as
                          the travel, skill and contact lists. */}
                      <ol className="mt-5 border-t border-white/8">
                        {post.route.map((stop, i) => (
                          <li
                            key={`${stop.name}-${i}`}
                            className="group relative block overflow-hidden border-b border-white/8 last:border-0"
                          >
                            <span
                              aria-hidden
                              className={cn(
                                "absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-brand-500/12 to-transparent transition-transform duration-500",
                                EASE,
                                "group-hover:scale-x-100"
                              )}
                            />

                            <div className="relative flex items-start gap-3.5 py-4">
                              <span className="mt-0.5 font-mono text-[11px] text-zinc-600 transition-colors duration-300 group-hover:text-brand-500">
                                {String(i + 1).padStart(2, "0")}
                              </span>

                              <span
                                className={cn(
                                  "min-w-0 flex-1 transition-transform duration-500",
                                  EASE,
                                  "group-hover:translate-x-1.5"
                                )}
                              >
                                <span className="block text-[13px] font-medium text-white transition-colors duration-300 group-hover:text-brand-400">
                                  {stop.name}
                                </span>
                                {stop.note ? (
                                  <span className="mt-1 block text-[11.5px] leading-relaxed text-zinc-500">
                                    {stop.note}
                                  </span>
                                ) : null}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </Reveal>
                ) : null}

                {post.riders.length ? (
                  <Reveal direction="right" delay={0.16}>
                    <div className="rounded-2xl border border-white/8 bg-panel p-6">
                      <Eyebrow>Rode with</Eyebrow>
                      <div className="mt-5">
                        <RiderLinks riders={post.riders} />
                      </div>
                    </div>
                  </Reveal>
                ) : null}
              </div>
            </aside>

            {/* ---------------- Article ---------------- */}
            <article className="rounded-2xl border border-white/8 bg-panel px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
              {post.route.length ? (
                <Reveal direction="up" className="mb-14">
                  <Eyebrow>The route</Eyebrow>
                  <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
                    <RouteMap waypoints={post.route} className="rounded-none border-0" />
                  </div>
                  <p className="mt-3 flex items-center gap-2.5 text-[11px] text-zinc-600">
                    <span aria-hidden className="h-px w-5 shrink-0 bg-brand-500/60" />
                    Tap a pin for details. Click the map to enable scroll zoom.
                  </p>
                </Reveal>
              ) : null}

              <PostBlocks blocks={post.blocks} />

              {/* ---------------- Related journeys ---------------- */}
              {related.length ? (
                <section className="mt-16 border-t border-white/8 pt-12">
                  <Eyebrow>Related journeys</Eyebrow>

                  <RevealGroup className="mt-6 border-t border-white/8" stagger={0.08}>
                    {related.map((other, i) => (
                      <RevealItem key={other.id}>
                        <Link
                          href={`/travel/${other.slug}`}
                          className="group relative block overflow-hidden border-b border-white/8"
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-brand-500/12 to-transparent transition-transform duration-500",
                              EASE,
                              "group-hover:scale-x-100"
                            )}
                          />

                          <div className="relative flex items-center gap-5 py-6">
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
                                <h3 className="text-lg font-semibold text-white transition-colors duration-300 group-hover:text-brand-400">
                                  {other.destination}
                                </h3>
                                <span className="font-mono text-[11px] text-zinc-600">
                                  {other.year}
                                </span>
                              </div>
                              <p className="mt-0.5 text-[12px] text-zinc-500">{other.region}</p>
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
                      </RevealItem>
                    ))}
                  </RevealGroup>
                </section>
              ) : null}

              {/* ---------------- Prev / next ---------------- */}
              {previous || next ? (
                <nav className="mt-14 grid gap-3 sm:grid-cols-2">
                  {previous ? (
                    <Link
                      href={`/travel/${trip.slug}/${previous.slug}`}
                      className="group relative overflow-hidden rounded-2xl border border-white/8 bg-panel-2 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500/40"
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
                        <span className="mt-2.5 block font-semibold text-white transition-colors duration-300 group-hover:text-brand-400">
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
                      className="group relative overflow-hidden rounded-2xl border border-white/8 bg-panel-2 p-6 text-right transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500/40 sm:col-start-2"
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
                        <span className="mt-2.5 block font-semibold text-white transition-colors duration-300 group-hover:text-brand-400">
                          {next.title}
                        </span>
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
