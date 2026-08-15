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
  amount = 0.25,
}: {
  children: ReactNode;
  className?: string;
  direction?: Direction;
  delay?: number;
  duration?: number;
  once?: boolean;
  amount?: number;
}) {
  const reduceMotion = useReducedMotion();
  const offset = offsets[direction];

  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: offset.x, y: offset.y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
      viewport={{ once, amount }}
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
      viewport={{ once, amount: 0.15 }}
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
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
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
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          <span className="eyebrow text-orange-500">{eyebrow}</span>
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
              "max-w-2xl text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base",
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
