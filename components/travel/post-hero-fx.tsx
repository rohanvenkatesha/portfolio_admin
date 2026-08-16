"use client";

import LightRays from "@/components/vendor/reactbits/LightRays";
import BlurText from "@/components/vendor/reactbits/BlurText";
import CountUp from "@/components/vendor/reactbits/CountUp";

/**
 * The client-side pieces of the hero and the figures band.
 *
 * These are thin wrappers around React Bits components rather than direct use
 * in the page, for two reasons: the page is a Server Component and these all
 * need the client, and wrapping means the vendored files stay untouched and
 * re-fetchable while our defaults live here.
 */

/** Ember rays behind the cover image. Decorative, so it never takes focus. */
export function HeroRays() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] opacity-70">
      <LightRays
        raysOrigin="top-center"
        raysColor="#ff6a2b"
        raysSpeed={0.7}
        lightSpread={1.1}
        rayLength={2.4}
        followMouse
        mouseInfluence={0.12}
        noiseAmount={0.06}
        distortion={0.04}
      />
    </div>
  );
}

/**
 * The title, revealed a word at a time.
 *
 * `animateBy="words"` rather than letters: at display size a per-letter reveal
 * on a ten-word title is a wall of independent motion, and the title stops
 * being readable while it plays.
 */
export function HeroTitle({ text, className }: { text: string; className?: string }) {
  return (
    <BlurText
      text={text}
      animateBy="words"
      direction="top"
      delay={90}
      stepDuration={0.4}
      className={className}
    />
  );
}

/**
 * A statistic that counts up when it scrolls into view.
 *
 * Only the numeric part animates. Values here are free text — "5,359 m",
 * "7 hrs", "1" — so the leading number is split off and counted, and whatever
 * follows is appended as a static suffix. A value with no leading digits is
 * rendered as-is rather than being forced through the counter.
 */
export function StatValue({ value }: { value: string }) {
  const match = value.match(/^(\d[\d,]*)(.*)$/);
  if (!match) return <>{value}</>;

  const digits = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(digits)) return <>{value}</>;

  return (
    <>
      <CountUp to={digits} duration={1.4} separator={match[1].includes(",") ? "," : ""} />
      {match[2]}
    </>
  );
}
