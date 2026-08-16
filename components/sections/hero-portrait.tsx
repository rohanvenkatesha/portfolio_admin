"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useProfile } from "@/components/providers/profile-provider";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Same fractal-noise wash the ember panels use, so the grain matches. */
const GRAIN =
  "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * The hero portrait, rendered as an ember duotone.
 *
 * The photo is desaturated and then remapped between two points: a `darken`
 * layer in the accent clamps the highlights, and a `lighten` layer in a warm
 * near-black lifts the shadows. Everything between lands on the ramp joining
 * them, which is what makes it read as one material with the ember panels
 * rather than a photo dropped on top of them.
 *
 * Hovering fades both layers out and releases the greyscale over 700ms, so the
 * true colour floods back in. That reveal is the only event here — there are
 * deliberately no frames, badges or plates competing with it.
 *
 * With `profile.portraitUrl` unset the frame shows an ember plate instead, so
 * the layout is finished with or without a photo.
 */
export function HeroPortrait({ className }: { className?: string }) {
  const profile = useProfile();
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // Pointer position within the card, normalised, driving the tilt.
  const nx = useMotionValue(0.5);
  const ny = useMotionValue(0.5);

  const spring = { stiffness: 200, damping: 24, mass: 0.4 };
  const rotateX = useSpring(useTransform(ny, [0, 1], [8, -8]), spring);
  const rotateY = useSpring(useTransform(nx, [0, 1], [-10, 10]), spring);

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    nx.set((event.clientX - rect.left) / rect.width);
    ny.set((event.clientY - rect.top) / rect.height);
  }

  function handleLeave() {
    nx.set(0.5);
    ny.set(0.5);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
      style={{ perspective: 1200 }}
      className={cn("relative w-full max-w-[13rem] sm:max-w-xs lg:max-w-none", className)}
    >
      {/* Ember bloom behind the frame, so the card sits in its own light */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-brand-600/25 blur-[90px]"
      />

      {/* `isolate` keeps the blend layers inside this box — without it they'd
          composite against the hero panel behind. */}
      <motion.div
        ref={ref}
        onMouseMove={reduceMotion ? undefined : handleMove}
        onMouseLeave={reduceMotion ? undefined : handleLeave}
        style={reduceMotion ? undefined : { rotateX, rotateY }}
        className="group/portrait relative isolate aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] bg-void"
      >
        {profile.portraitUrl ? (
          <>
            <Image
              src={profile.portraitUrl}
              alt={profile.name}
              fill
              priority
              sizes="(max-width: 640px) 272px, (max-width: 1024px) 320px, 384px"
              className="object-cover object-center grayscale contrast-[1.15] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/portrait:scale-[1.03] group-hover/portrait:contrast-100 group-hover/portrait:grayscale-0"
            />

            {/* Highlights clamp down to the accent… */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-brand-500 mix-blend-darken transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/portrait:opacity-0"
            />
            {/* …and shadows lift to a warm black, closing the duotone */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[#170b04] mix-blend-lighten transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/portrait:opacity-0"
            />
          </>
        ) : (
          <PortraitPlaceholder />
        )}

        {/* Grain, over whichever of the two is showing */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay"
          style={{ backgroundImage: GRAIN }}
        />

        {/* Softens the bottom edge into the panel rather than ending on a cut */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-void/75 to-transparent"
        />
      </motion.div>
    </motion.div>
  );
}

/**
 * Stand-in until a photo is set. Built on the same `ember-fill` gradient as the
 * closing panel, so the placeholder already sits in the palette the duotone
 * will land in.
 */
function PortraitPlaceholder() {
  const profile = useProfile();
  return (
    <div className="absolute inset-0 grid place-items-center overflow-hidden">
      <div aria-hidden className="ember-fill absolute inset-0" />
      <div aria-hidden className="absolute inset-0 bg-grid opacity-30" />
      <span className="display-name relative text-[5.5rem] leading-none text-white/85">
        {profile.initials}
      </span>
    </div>
  );
}
