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

export function Hero() {
  return (
    <section id="hero" className="relative scroll-mt-24 px-3 pt-24 sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-[100rem]">
        {/* ---------------- Hero panel ---------------- */}
        {/* Height is deliberately restrained: without a portrait filling it, a
            taller panel leaves a dead zone between the copy and the masthead. */}
        <div className="relative flex min-h-[clamp(26rem,66svh,40rem)] flex-col overflow-hidden rounded-[1.75rem] border border-white/8 bg-panel sm:rounded-[2.25rem]">
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
          <div className="absolute -left-40 top-1/3 z-[2] h-[34rem] w-[34rem] rounded-full bg-orange-600/12 blur-[130px]" />

          {/* Top row */}
          <div className="relative z-10 flex flex-1 flex-col gap-10 p-6 sm:p-9 lg:flex-row lg:items-start lg:justify-between lg:p-12">
            {/* Left: status + headline */}
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <StatusPulse label="Available for work" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="mt-6 text-balance text-3xl font-bold leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-5xl"
              >
                Python AI Engineer
                <br />
                based in <span className="text-orange-500">Michigan</span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="mt-5 flex min-h-[2rem] items-center gap-3 text-lg font-medium text-zinc-400 sm:text-xl"
              >
                <span className="h-px w-8 shrink-0 bg-orange-500" />
                <Typewriter words={profile.roles} />
              </motion.div>
            </div>

            {/* Right: bio + CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-sm lg:pt-2"
            >
              <p className="text-sm leading-relaxed text-zinc-400">{profile.bioShort}</p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
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
                        className="group flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-panel-2 px-5 py-4 transition-all hover:border-orange-500/50"
                      >
                        <span className="min-w-0">
                          <span className="eyebrow block text-zinc-500">Email</span>
                          <span className="block truncate text-sm font-medium text-white">
                            {profile.email}
                          </span>
                        </span>
                        <ArrowUpRight className="h-5 w-5 shrink-0 text-zinc-500 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-orange-400" />
                      </a>

                      <div className="flex items-center gap-2.5 text-sm text-zinc-400">
                        <MapPin className="h-4 w-4 text-orange-500" />
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

          {/* Oversized name, anchored to the bottom of the panel */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 select-none px-6 pb-7 sm:px-9 sm:pb-9 lg:px-12 lg:pb-11"
          >
            {/* Sized in vw with nowrap so the masthead always spans the panel
                width at every breakpoint, with a little inset either side. */}
            <span className="display-name block whitespace-nowrap text-white [font-size:clamp(1.6rem,8.4vw,9rem)]">
              {profile.name}
            </span>
          </motion.div>
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
          className="mx-auto mt-8 flex w-fit flex-col items-center gap-2 text-zinc-600 transition-colors hover:text-orange-400"
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
