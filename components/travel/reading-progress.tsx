"use client";

import { motion, useScroll, useSpring } from "motion/react";

/**
 * A hairline that fills as you read.
 *
 * Long-form pages hide their own length — the scrollbar is the only cue, and on
 * a trackpad it fades out. This restores that signal without adding furniture:
 * two pixels at the very top, the accent colour, nothing to interact with.
 *
 * Sprung rather than bound directly to scroll, so a flick of the wheel eases in
 * instead of snapping and drawing the eye away from the writing.
 */
export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const width = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX: width }}
      className="ember-fill fixed inset-x-0 top-0 z-50 h-[2px] origin-left"
    />
  );
}
