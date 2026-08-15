"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useInView,
  useReducedMotion,
} from "motion/react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Scroll progress bar                                                         */
/* -------------------------------------------------------------------------- */

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[80] h-[2px] origin-left bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400"
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Film-grain + vignette overlay                                               */
/* -------------------------------------------------------------------------- */

const GRAIN_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'>
      <filter id='n'>
        <feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/>
        <feColorMatrix type='saturate' values='0'/>
      </filter>
      <rect width='100%' height='100%' filter='url(#n)' opacity='0.5'/>
    </svg>`
  );

export function GrainOverlay() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{ backgroundImage: `url("${GRAIN_SVG}")`, backgroundSize: "140px 140px" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55))]" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Ambient aurora background                                                   */
/* -------------------------------------------------------------------------- */

export function Aurora({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute -left-[10%] top-[-15%] h-[46rem] w-[46rem] rounded-full bg-orange-500/12 blur-[120px] animate-drift" />
      <div className="absolute right-[-12%] top-[18%] h-[40rem] w-[40rem] rounded-full bg-orange-600/12 blur-[130px] animate-drift [animation-delay:-7s]" />
      <div className="absolute bottom-[-18%] left-[28%] h-[34rem] w-[34rem] rounded-full bg-orange-500/8 blur-[120px] animate-drift [animation-delay:-14s]" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Magnetic wrapper — element drifts toward the cursor                          */
/* -------------------------------------------------------------------------- */

export function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.4 });

  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={cn("inline-block", className)}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((e.clientX - (rect.left + rect.width / 2)) * strength);
        y.set((e.clientY - (rect.top + rect.height / 2)) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Count-up number, triggered when scrolled into view                          */
/* -------------------------------------------------------------------------- */

export function Counter({
  value,
  suffix = "",
  duration = 1600,
  className,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    // Under reduced motion the final value is derived during render instead,
    // so there's nothing to animate here.
    if (!inView || reduceMotion) return;

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplay(Math.round(eased * value));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      {(reduceMotion ? value : display).toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Infinite marquee                                                            */
/* -------------------------------------------------------------------------- */

export function Marquee({
  items,
  className,
  reverse = false,
}: {
  items: string[];
  className?: string;
  reverse?: boolean;
}) {
  const doubled = [...items, ...items];

  return (
    <div className={cn("mask-fade-x relative flex overflow-hidden", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center gap-10 whitespace-nowrap animate-marquee",
          reverse && "[animation-direction:reverse]"
        )}
      >
        {doubled.map((item, i) => (
          <span key={`${item}-${i}`} className="flex items-center gap-10">
            <span className="eyebrow text-zinc-500 transition-colors hover:text-orange-300">
              {item}
            </span>
            <span className="h-1 w-1 rounded-full bg-orange-400/50" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Live status pulse                                                           */
/* -------------------------------------------------------------------------- */

export function StatusPulse({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn(
        "glass inline-flex items-center gap-2.5 rounded-full px-4 py-2",
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-pulse-ring" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.7)]" />
      </span>
      <span className="text-xs font-medium text-zinc-300">{label}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Typewriter that cycles through phrases                                      */
/* -------------------------------------------------------------------------- */

export function Typewriter({
  words,
  className,
  typeSpeed = 70,
  deleteSpeed = 36,
  holdTime = 1900,
}: {
  words: readonly string[];
  className?: string;
  typeSpeed?: number;
  deleteSpeed?: number;
  holdTime?: number;
}) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;

    const current = words[index % words.length];
    const atFullWord = !deleting && text === current;
    const atEmpty = deleting && text === "";

    // Every transition is scheduled rather than applied inline, so the effect
    // body itself never calls setState.
    const delay = atFullWord ? holdTime : atEmpty ? 240 : deleting ? deleteSpeed : typeSpeed;

    const timer = setTimeout(() => {
      if (atFullWord) {
        setDeleting(true);
      } else if (atEmpty) {
        setDeleting(false);
        setIndex((i) => (i + 1) % words.length);
      } else {
        setText((prev) =>
          deleting ? current.slice(0, prev.length - 1) : current.slice(0, prev.length + 1)
        );
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [text, deleting, index, words, typeSpeed, deleteSpeed, holdTime, reduceMotion]);

  if (reduceMotion) {
    return <span className={className}>{words[0]}</span>;
  }

  return (
    <span className={className}>
      {text}
      <span className="ml-0.5 inline-block h-[0.9em] w-[3px] translate-y-[2px] bg-orange-400 animate-blink" />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Parallax wrapper driven by scroll                                           */
/* -------------------------------------------------------------------------- */

export function ScrollParallax({
  children,
  offset = 60,
  className,
}: {
  children: ReactNode;
  offset?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const raw = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  const y = useSpring(raw, { stiffness: 90, damping: 24 });

  return (
    <div ref={ref} className={className}>
      {reduceMotion ? children : <motion.div style={{ y }}>{children}</motion.div>}
    </div>
  );
}
