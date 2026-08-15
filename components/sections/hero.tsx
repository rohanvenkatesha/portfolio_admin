"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { ArrowDown, ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { Marquee, StatusPulse, Typewriter } from "@/components/fx/effects";
import { PillButton, PillLink } from "@/components/ui/primitives";
import { SocialLinks } from "@/components/ui/social-links";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { profile } from "@/content/site";

/**
 * three.js is loaded on the client only and outside the first-load bundle. The
 * panel's gradients carry the design until the canvas arrives, so there's
 * nothing to fall back to visually.
 */
const HeroNetwork = dynamic(
  () => import("@/components/three/hero-network").then((m) => m.HeroNetwork),
  { ssr: false }
);

const MARQUEE_ITEMS = [
  "Vertex AI",
  "Gemini",
  "LangGraph",
  "pgvector",
  "FastAPI",
  "Next.js",
  "YOLOv8",
  "Document AI",
  "Cloud Run",
  "AWS Lambda",
  "PostgreSQL",
  "Docker",
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  return (
    <section id="hero" className="relative scroll-mt-24 px-3 pt-24 sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-[100rem]">
        {/* ---------------- Hero panel ---------------- */}
        {/* The floor is deliberately below what the stacked content needs, so
            the content sets the height. A taller floor forces leftover space
            somewhere, and there's no portrait here to absorb it. */}
        <div className="relative flex min-h-[clamp(20rem,52svh,30rem)] flex-col overflow-hidden rounded-[1.75rem] border border-white/8 bg-panel sm:rounded-[2.25rem]">
          {/* Layered backdrop — portrait when supplied, particle field otherwise */}
          <div className="absolute inset-0 bg-grid opacity-70" />

          {profile.portraitUrl ? (
            <Image
              src={profile.portraitUrl}
              alt={profile.name}
              fill
              priority
              sizes="100vw"
              className="z-[1] object-cover object-[center_25%]"
            />
          ) : (
            <HeroNetwork className="absolute inset-0 z-[1]" />
          )}

          <div className="absolute inset-0 z-[2] bg-gradient-to-t from-panel via-panel/45 to-panel/10" />
          <div className="absolute -left-40 top-1/3 z-[2] h-[34rem] w-[34rem] rounded-full bg-brand-600/12 blur-[130px]" />

          {/**
           * One vertical stack in two tiers:
           *   masthead  — name, then what I do
           *   support   — bio and calls to action
           *
           * Deliberately NOT justify-between: that distributes leftover height
           * into the gap between the tiers, which reads as a hole under the
           * role line. Flowing from the top with a fixed gap sends any spare
           * height harmlessly to the bottom of the panel instead.
           */}
          <div className="relative z-10 flex flex-1 flex-col gap-10 p-6 sm:p-9 lg:gap-12 lg:p-12">
            {/* ---------- Masthead ---------- */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                <StatusPulse label="Available for work" />
              </motion.div>

              {/* Sized in vw with nowrap so the name spans the panel at every
                  breakpoint, the way a masthead should. */}
              <motion.h1
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.08, ease: EASE }}
                className="display-name mt-6 whitespace-nowrap text-white [font-size:clamp(1.6rem,8.4vw,9rem)]"
              >
                {profile.name}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.18, ease: EASE }}
                className="mt-5 text-xl font-semibold tracking-tight text-zinc-200 sm:text-2xl lg:text-3xl"
              >
                Python AI Engineer, based in{" "}
                <span className="text-brand-500">Michigan</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.26, ease: EASE }}
                className="mt-4 flex min-h-[1.75rem] items-center gap-3 text-base font-medium text-zinc-500 sm:text-lg"
              >
                <span className="h-px w-8 shrink-0 bg-brand-500" />
                <Typewriter words={profile.roles} />
              </motion.div>
            </div>

            {/* ---------- Support ---------- */}
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.34, ease: EASE }}
              className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
            >
              <p className="max-w-md text-sm leading-relaxed text-zinc-400">
                {profile.bioShort}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <PillLink href="#work">See my work</PillLink>

                <Dialog>
                  <DialogTrigger asChild>
                    <PillButton variant="outline">
                      Let&apos;s connect
                      <Sparkles className="h-3.5 w-3.5" />
                    </PillButton>
                  </DialogTrigger>

                  <DialogContent className="p-8 sm:p-10">
                    <DialogTitle>Let&apos;s build something</DialogTitle>
                    <DialogDescription className="mt-3">
                      Open to AI &amp; full-stack engineering work, and to visual collaborations.
                      The fastest route is email.
                    </DialogDescription>

                    <div className="mt-7 space-y-5">
                      <a
                        href={`mailto:${profile.email}`}
                        className="group flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-panel-2 px-5 py-4 transition-all hover:border-brand-500/50"
                      >
                        <span className="min-w-0">
                          <span className="eyebrow block text-zinc-500">Email</span>
                          <span className="block truncate text-sm font-medium text-white">
                            {profile.email}
                          </span>
                        </span>
                        <ArrowUpRight className="h-5 w-5 shrink-0 text-zinc-500 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-400" />
                      </a>

                      <div className="flex items-center gap-2.5 text-sm text-zinc-400">
                        <MapPin className="h-4 w-4 text-brand-500" />
                        {profile.location}
                      </div>

                      <div>
                        <span className="eyebrow mb-3 block text-zinc-500">Elsewhere</span>
                        <SocialLinks showLabels size="sm" />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ---------------- Tech strip ---------------- */}
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/8 bg-panel py-5">
          <Marquee items={MARQUEE_ITEMS} />
        </div>

        {/* Scroll cue */}
        <motion.a
          href="#journey"
          aria-label="Scroll to next section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mx-auto mt-8 flex w-fit flex-col items-center gap-2 text-zinc-600 transition-colors hover:text-brand-400"
        >
          <span className="eyebrow text-[10px]">Scroll</span>
          <motion.span
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowDown className="h-4 w-4" />
          </motion.span>
        </motion.a>
      </div>
    </section>
  );
}
