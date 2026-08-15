"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";
import { cn } from "@/lib/utils";

/**
 * React's drag/animation DOM handlers collide with Framer Motion's gesture
 * props of the same name, so they're excluded from the pass-through props.
 */
type DivProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration"
>;

const ACCENT_RGB: Record<string, string> = {
  cyan: "249,115,22",
  violet: "249,115,22",
  amber: "249,115,22",
  lime: "249,115,22",
  rose: "249,115,22",
};

/**
 * Glass card that tilts in 3D toward the pointer and carries a radial glow
 * anchored to the cursor. Falls back to a static card under reduced-motion.
 */
export function TiltCard({
  children,
  className,
  intensity = 9,
  accent = "cyan",
  glow = true,
  spotlightSize = 380,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
  accent?: keyof typeof ACCENT_RGB;
  glow?: boolean;
  spotlightSize?: number;
} & DivProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // Normalised pointer position within the card (0..1)
  const nx = useMotionValue(0.5);
  const ny = useMotionValue(0.5);
  // Raw pixel position, for the spotlight gradient
  const gx = useMotionValue(-500);
  const gy = useMotionValue(-500);

  const springCfg = { stiffness: 220, damping: 22, mass: 0.4 };
  const rotateX = useSpring(useTransform(ny, [0, 1], [intensity, -intensity]), springCfg);
  const rotateY = useSpring(useTransform(nx, [0, 1], [-intensity, intensity]), springCfg);

  const rgb = ACCENT_RGB[accent] ?? ACCENT_RGB.cyan;
  const spotlight = useMotionTemplate`radial-gradient(${spotlightSize}px circle at ${gx}px ${gy}px, rgba(${rgb},0.18), transparent 70%)`;
  const borderGlow = useMotionTemplate`radial-gradient(${spotlightSize * 0.8}px circle at ${gx}px ${gy}px, rgba(${rgb},0.55), transparent 65%)`;

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    gx.set(px);
    gy.set(py);
    nx.set(px / rect.width);
    ny.set(py / rect.height);
  }

  function handleLeave() {
    nx.set(0.5);
    ny.set(0.5);
    gx.set(-500);
    gy.set(-500);
  }

  if (reduceMotion) {
    return (
      <div
        className={cn(
          "glass relative overflow-hidden rounded-2xl transition-colors hover:border-white/20",
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }

  return (
    <div style={{ perspective: 1100 }} className="h-full">
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        whileHover={{ z: 24 }}
        className={cn(
          "glass group/tilt relative h-full overflow-hidden rounded-2xl transition-colors duration-300 hover:border-white/20",
          className
        )}
        {...rest}
      >
        {/* Border glow that follows the cursor */}
        {glow ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
            style={{ background: borderGlow, maskImage: "linear-gradient(#000,#000)" }}
          />
        ) : null}

        {/* Inner surface sits above the border glow. One step brighter than the
            parent panel so cards read as raised, not recessed. */}
        <div className="relative h-full rounded-2xl bg-panel-2">
          {glow ? (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
              style={{ background: spotlight }}
            />
          ) : null}
          <div className="relative h-full" style={{ transform: "translateZ(40px)" }}>
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/** Lighter variant: cursor-tracked glow with no tilt. */
export function GlowCard({
  children,
  className,
  accent = "cyan",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  accent?: keyof typeof ACCENT_RGB;
} & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const gx = useMotionValue(-500);
  const gy = useMotionValue(-500);
  const rgb = ACCENT_RGB[accent] ?? ACCENT_RGB.cyan;
  const spotlight = useMotionTemplate`radial-gradient(300px circle at ${gx}px ${gy}px, rgba(${rgb},0.14), transparent 72%)`;

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        gx.set(e.clientX - rect.left);
        gy.set(e.clientY - rect.top);
      }}
      onMouseLeave={() => {
        gx.set(-500);
        gy.set(-500);
      }}
      className={cn(
        "glass group/glow relative overflow-hidden rounded-2xl transition-colors duration-300 hover:border-white/20",
        className
      )}
      {...rest}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/glow:opacity-100"
        style={{ background: spotlight }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
