"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "left" | "right" | "none";

const offsets: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 34 },
  down: { x: 0, y: -34 },
  left: { x: 40, y: 0 },
  right: { x: -40, y: 0 },
  none: { x: 0, y: 0 },
};

/** Scroll-triggered fade + slide. Respects reduced-motion by rendering statically. */
export function Reveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.7,
  once = true,
  amount = "some",
}: {
  children: ReactNode;
  className?: string;
  direction?: Direction;
  delay?: number;
  duration?: number;
  once?: boolean;
  amount?: number | "some" | "all";
}) {
  const reduceMotion = useReducedMotion();
  const offset = offsets[direction];

  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: offset.x, y: offset.y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
      /**
       * `amount: "some"` with a shrunken root, not a fraction.
       *
       * This was `amount: 0.25`, which asks for a quarter of the element to be
       * on screen — impossible for anything taller than four viewports, so it
       * never fired and the element stayed at opacity 0 permanently. A single
       * 5,300-character paragraph measured 4,793px and was invisible on a phone
       * for exactly this reason.
       *
       * "some" triggers on any intersection at all, and the inset margin holds
       * back the start until the element is properly into the viewport, which
       * is what the fraction was really for.
       */
      viewport={{ once, amount, margin: "-12% 0px -12% 0px" }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Staggered container — pair with <RevealItem> for list/grid entrances. */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  once?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      // Same reasoning as Reveal above: a fraction can exceed the viewport on
      // a tall group and then never fires.
      viewport={{ once, amount: "some", margin: "-10% 0px -10% 0px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
        show: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Editorial section heading: a compact accent label, a large tightly-tracked
 * title, and a measured description. No decorative rules — the type carries it.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "default",
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  /**
   * "ember" for headings sitting on the warm backdrop, where the orange
   * accent and the zinc ramp both disappear into the ground.
   */
  tone?: "default" | "ember";
  className?: string;
}) {
  const onEmber = tone === "ember";

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className
      )}
    >
      <Reveal direction="up">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              onEmber ? "bg-white" : "bg-brand-500"
            )}
          />
          <span className={cn("eyebrow", onEmber ? "text-white/80" : "text-brand-500")}>
            {eyebrow}
          </span>
        </div>
      </Reveal>

      <Reveal direction="up" delay={0.08}>
        <h2 className="max-w-3xl text-balance text-3xl font-bold leading-[1.06] tracking-tight text-white sm:text-4xl lg:text-5xl">
          {title}
        </h2>
      </Reveal>

      {description ? (
        <Reveal direction="up" delay={0.16}>
          <p
            className={cn(
              "max-w-2xl text-pretty text-sm leading-relaxed sm:text-base",
              onEmber ? "text-white/70" : "text-zinc-400",
              align === "center" && "mx-auto"
            )}
          >
            {description}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
