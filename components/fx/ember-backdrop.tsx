"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * The warm full-bleed backdrop from the closing call-to-action.
 *
 * Four stacked layers: a diagonal ember gradient, a soft radial highlight, a
 * grain wash to stop the gradient banding, and a slow drifting bloom.
 *
 * Use it sparingly. The whole design rests on orange being an accent against
 * neutral panels — if several sections in a row are warm, it stops reading as
 * emphasis and just becomes the background. Two or three per page is the
 * ceiling; the reference layout uses exactly this treatment twice.
 *
 * Drop it inside a `relative overflow-hidden` container and put the content in
 * a sibling with `relative`. Text on top needs white / white-alpha rather than
 * the usual zinc ramp, and the orange accent must become white — orange on
 * orange disappears.
 */
export function EmberBackdrop({
  className,
  drift = true,
}: {
  className?: string;
  /** Set false for small panels where a moving bloom is more distraction than depth. */
  drift?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-800 to-zinc-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.18),transparent_60%)]" />

      <div
        className="absolute inset-0 opacity-[0.13] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {drift && !reduceMotion ? (
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-20 top-0 h-96 w-96 rounded-full bg-brand-300/25 blur-[110px]"
        />
      ) : (
        <div className="absolute -right-20 top-0 h-96 w-96 rounded-full bg-brand-300/20 blur-[110px]" />
      )}
    </div>
  );
}
