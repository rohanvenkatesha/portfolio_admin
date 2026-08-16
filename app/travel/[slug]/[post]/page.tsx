import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { DetailChrome } from "@/components/layout/detail-chrome";
import { Footer } from "@/components/layout/footer";
import { PostBlocks } from "@/components/travel/post-blocks";
import { PostGalleryReel } from "@/components/travel/post-gallery-reel";
import { HeroTitle, StatValue } from "@/components/travel/post-hero-fx";
import { RelatedJourneys } from "@/components/travel/related-journeys";
import { RiderLinks } from "@/components/travel/rider-links";
import { ReadingProgress } from "@/components/travel/reading-progress";
import { EmberBackdrop } from "@/components/fx/ember-backdrop";
import { Reveal, RevealGroup, RevealItem } from "@/components/fx/reveal";
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
 * The post page, rebuilt as an editorial spread.
 *
 * Two earlier versions failed in opposite directions: one dressed the article
 * in the home page's marketing panels, the other boxed it into a card layout
 * with a rail of glass tiles. Both put chrome between the reader and the
 * writing.
 *
 * There are no cards here. Structure is carried by hairline rules, an oversized
 * numeral per section, and the width a thing is allowed to occupy — media runs
 * the full spread, text is held to a reading measure, and the gap between the
 * two is the layout. Metadata is monospace and small; headlines are enormous.
 */

/** Page gutters. Everything shares them so nothing drifts out of alignment. */
const GUTTER = "px-5 sm:px-8 lg:px-14";

/**
 * The reading spread: a numbered margin, then the article.
 *
 * The margin holds the section number and label, sticky within its own section
 * so it stays beside the writing it names. Below `lg` it collapses and the
 * label sits inline above the text — a 100px margin on a phone is a wasted
 * fifth of the screen.
 */
const SPREAD = "mx-auto grid w-full max-w-[78rem] gap-y-5 lg:grid-cols-[9rem_minmax(0,1fr)] lg:gap-x-10";

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

/** Numeric and monospace — it sits in a metadata strip, not in a sentence. */
function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`)
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    })
    .toUpperCase();
}

/**
 * Reading time from the body text.
 *
 * 220 words a minute, rounded up, floor of one. Counted from the text blocks
 * only — captions and stop notes are glanced at, not read through.
 */
function readingTime(blocks: { type: string; body?: string }[]): number {
  const words = blocks
    .filter((b) => b.type === "text")
    .reduce((total, b) => total + (b.body ?? "").trim().split(/\s+/).filter(Boolean).length, 0);
  return Math.max(1, Math.ceil(words / 220));
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

  const images = collectImages(post.blocks);
  const minutes = readingTime(post.blocks);

  const related = post.relatedTripIds
    .map((id) => trips.find((t) => t.id === id))
    .filter((t): t is (typeof trips)[number] => Boolean(t) && t!.id !== trip.id);

  // Sections are numbered in the margin, so they have to be counted in the
  // order they actually render rather than hardcoded.
  const order: string[] = [
    "story",
    ...(post.route.length ? ["route"] : []),
    ...(images.length ? ["frames"] : []),
    ...(post.riders.length ? ["company"] : []),
  ];
  const numberOf = (key: string) => String(order.indexOf(key) + 1).padStart(2, "0");

  return (
    <>
      <ReadingProgress />
      <DetailChrome backHref={`/travel/${trip.slug}`} backLabel={trip.destination} />

      <main className="relative flex-1">
        {/* ================= Hero ==============================================
            Full bleed, anchored bottom-left. Centred titles read as posters;
            an article should start where the reading starts.
            ===================================================================== */}
        <section className="relative flex min-h-[78svh] w-full items-end overflow-hidden">
          {post.coverUrl ? (
            <Image src={post.coverUrl} alt="" fill priority sizes="100vw" className="object-cover" />
          ) : (
            <EmberBackdrop />
          )}

          {/* HeroRays (React Bits LightRays) is deliberately not mounted here.
              Its WebGL init awaits a timer before appending its canvas, which
              loses a race with React StrictMode's double-invoked effects in
              dev: the container stays empty and the rays never appear. The
              wrapper is kept in post-hero-fx.tsx for when that's sorted. */}

          {/* Weighted to the bottom, where the type sits. */}
          <div className="absolute inset-0 z-[2] bg-gradient-to-t from-void via-void/80 to-void/25" />
          <div className="absolute inset-x-0 bottom-0 z-[2] h-40 bg-gradient-to-t from-void to-transparent" />

          <div className={cn("relative z-10 w-full pb-16 pt-32 sm:pb-20", GUTTER)}>
            <div className="mx-auto w-full max-w-[78rem]">
              {/* Metadata strip: everything you'd want before committing to
                  read, in one monospace line. */}
              <Reveal direction="up">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-zinc-400 sm:text-[11px]">
                  <Link
                    href={`/travel/${trip.slug}`}
                    className="group inline-flex items-center gap-1.5 text-brand-400 transition-colors hover:text-brand-300"
                  >
                    {trip.destination}
                    <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:rotate-45" />
                  </Link>
                  {post.date ? (
                    <>
                      <Rule />
                      <time dateTime={post.date}>{formatDate(post.date)}</time>
                    </>
                  ) : null}
                  <Rule />
                  <span>{minutes} min read</span>
                  {post.route.length ? (
                    <>
                      <Rule />
                      <span>{post.route.length} stops</span>
                    </>
                  ) : null}
                </div>
              </Reveal>

              {/* The one piece of display type on the page, and it is very
                  large — at this scale the title does the work that a panel,
                  a border and an eyebrow were doing before. */}
              <h1 className="display-name mt-7 max-w-[16ch] text-white [font-size:clamp(2.5rem,7.5vw,6.5rem)] [line-height:0.94]">
                <HeroTitle text={post.title} />
              </h1>

              {post.excerpt ? (
                <Reveal direction="up" delay={0.16}>
                  <p className="mt-8 max-w-[38rem] text-pretty text-[15.5px] leading-relaxed text-zinc-300 sm:text-[17px]">
                    {post.excerpt}
                  </p>
                </Reveal>
              ) : null}
            </div>
          </div>
        </section>

        {/* ================= Figures ============================================
            A full-bleed band of numerals divided by hairlines. No cards: at this
            size the numbers are the graphic.
            ===================================================================== */}
        {post.stats.length ? (
          <section className={cn("w-full border-y border-white/10", GUTTER)}>
            <RevealGroup
              className="mx-auto grid w-full max-w-[78rem] grid-cols-2 lg:grid-cols-4"
              stagger={0.07}
            >
              {post.stats.map((stat, i) => (
                <RevealItem
                  key={stat.label}
                  className={cn(
                    "py-8 sm:py-12",
                    // Hairlines between, never around — a closing border on the
                    // last column would box the band back into a card.
                    "border-white/10 pr-6",
                    i % 2 === 1 && "border-l pl-6 lg:pl-8",
                    i >= 2 && "border-t lg:border-t-0",
                    i % 4 !== 0 && "lg:border-l lg:pl-8"
                  )}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1]">
                    <StatValue value={stat.value} />
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
          </section>
        ) : null}

        {/* ================= The writing ======================================== */}
        <section className={cn("w-full pt-20 sm:pt-28", GUTTER)}>
          <div className={SPREAD}>
            <Margin number={numberOf("story")} label="The Story" />
            <div className="min-w-0">
              <PostBlocks blocks={post.blocks} />
            </div>
          </div>
        </section>

        {/* ================= Route ==============================================
            Map full bleed, stops beneath it in a numbered list that stays
            legible whether there are three or fifteen.
            ===================================================================== */}
        {post.route.length ? (
          <section className={cn("w-full pt-24 sm:pt-32", GUTTER)}>
            <div className={SPREAD}>
              <Margin number={numberOf("route")} label="The Route" />

              <div className="min-w-0">
                <Reveal direction="up">
                  <RouteMap waypoints={post.route} className="h-[26rem] sm:h-[34rem]" />
                </Reveal>

                <RevealGroup
                  className="mt-10 grid gap-x-10 gap-y-0 sm:grid-cols-2"
                  stagger={0.04}
                >
                  {post.route.map((stop, i) => (
                    <RevealItem
                      key={`${stop.name}-${i}`}
                      className="flex gap-5 border-t border-white/10 py-5"
                    >
                      <span className="font-mono text-[11px] leading-6 text-brand-500">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-[15.5px] font-semibold text-white">{stop.name}</h3>
                        {stop.note ? (
                          <p className="mt-1.5 text-[13.5px] leading-relaxed text-zinc-500">
                            {stop.note}
                          </p>
                        ) : null}
                        <p className="mt-2 font-mono text-[10.5px] tracking-wider text-zinc-700">
                          {stop.lat.toFixed(3)}, {stop.lng.toFixed(3)}
                        </p>
                      </div>
                    </RevealItem>
                  ))}
                </RevealGroup>
              </div>
            </div>
          </section>
        ) : null}

        {/* ================= Frames ============================================= */}
        {images.length ? (
          <section className={cn("w-full pt-24 sm:pt-32", GUTTER)}>
            <div className={SPREAD}>
              <Margin
                number={numberOf("frames")}
                label="Frames"
                note={`${images.length} ${images.length === 1 ? "photograph" : "photographs"}`}
              />
              <div className="min-w-0">
                <PostGalleryReel images={images} />
              </div>
            </div>
          </section>
        ) : null}

        {/* ================= Company ============================================ */}
        {post.riders.length ? (
          <section className={cn("w-full pt-24 sm:pt-32", GUTTER)}>
            <div className={SPREAD}>
              <Margin number={numberOf("company")} label="Company" />
              <div className="min-w-0">
                <Reveal direction="up">
                  <RiderLinks riders={post.riders} />
                </Reveal>
              </div>
            </div>
          </section>
        ) : null}

        {/* ================= Elsewhere ==========================================
            Oversized list rows rather than cards — the same treatment the
            related trips get everywhere else, at editorial scale.
            ===================================================================== */}
        {related.length ? (
          <section className={cn("w-full pt-28 sm:pt-36", GUTTER)}>
            <div className="mx-auto w-full max-w-[78rem]">
              <Reveal direction="up">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-zinc-500">
                  Elsewhere
                </p>
              </Reveal>

              <div className="mt-8 border-t border-white/10">
                <RelatedJourneys
                  items={related.map((other) => ({
                    slug: other.slug,
                    destination: other.destination,
                    coverUrl: other.coverUrl,
                  }))}
                />
              </div>
            </div>
          </section>
        ) : null}

        {/* ================= Prev / next ======================================== */}
        {previous || next ? (
          <section className={cn("w-full pb-24 pt-28 sm:pt-36", GUTTER)}>
            <div className="mx-auto grid w-full max-w-[78rem] gap-px overflow-hidden border-y border-white/10 sm:grid-cols-2">
              {previous ? (
                <Adjacent
                  href={`/travel/${trip.slug}/${previous.slug}`}
                  label="Previous"
                  title={previous.title}
                  direction="back"
                />
              ) : (
                <span className="hidden sm:block" />
              )}
              {next ? (
                <Adjacent
                  href={`/travel/${trip.slug}/${next.slug}`}
                  label="Next"
                  title={next.title}
                  direction="forward"
                />
              ) : null}
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Spread furniture                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The numbered margin beside a section.
 *
 * Sticky within its own section, so the number tracks the writing it belongs to
 * and releases when the next section arrives — the effect a printed running
 * head has, without a fixed bar taking up screen.
 */
function Margin({ number, label, note }: { number: string; label: string; note?: string }) {
  return (
    <div className="lg:sticky lg:top-28 lg:self-start">
      <div className="flex items-baseline gap-3 lg:block">
        <p className="font-mono text-[11px] tabular-nums text-brand-500 lg:text-[13px]">{number}</p>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-zinc-500 lg:mt-3">
          {label}
        </p>
      </div>
      {note ? (
        <p className="mt-2 hidden font-mono text-[10.5px] tracking-wider text-zinc-700 lg:block">
          {note}
        </p>
      ) : null}
      <span aria-hidden className="mt-5 hidden h-px w-10 bg-white/15 lg:block" />
    </div>
  );
}

function Adjacent({
  href,
  label,
  title,
  direction,
}: {
  href: string;
  label: string;
  title: string;
  direction: "back" | "forward";
}) {
  const Icon = direction === "back" ? ArrowLeft : ArrowRight;

  return (
    <Link
      href={href}
      className={cn(
        "group relative overflow-hidden px-2 py-10 transition-colors sm:px-6 sm:py-14",
        direction === "forward" && "text-right sm:col-start-2"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 scale-x-0 bg-gradient-to-r from-brand-500/10 to-transparent transition-transform duration-500",
          direction === "back" ? "origin-left" : "origin-right bg-gradient-to-l",
          EASE,
          "group-hover:scale-x-100"
        )}
      />
      <span
        className={cn(
          "relative flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-zinc-500",
          direction === "forward" && "justify-end"
        )}
      >
        {direction === "back" ? (
          <Icon className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-1" />
        ) : null}
        {label}
        {direction === "forward" ? (
          <Icon className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
        ) : null}
      </span>
      <span className="relative mt-4 block text-2xl font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-brand-400 sm:text-3xl">
        {title}
      </span>
    </Link>
  );
}

/** The divider between metadata items. */
function Rule() {
  return <span aria-hidden className="h-3 w-px bg-white/20" />;
}
