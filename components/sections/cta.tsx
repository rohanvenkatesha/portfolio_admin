"use client";

import { motion } from "motion/react";
import { Reveal } from "@/components/fx/reveal";
import { PillLink } from "@/components/ui/primitives";
import { profile } from "@/content/site";

/**
 * Full-bleed closing panel. Warm gradient rather than photography, so it
 * carries the accent without needing an asset that doesn't exist yet.
 */
export function CallToAction() {
  return (
    <section id="cta" className="relative scroll-mt-24 px-3 py-3 sm:px-5 lg:px-6">
      <div className="relative mx-auto w-full max-w-[100rem] overflow-hidden rounded-[1.75rem] border border-white/8">
        {/* Warm ground */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-800 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.18),transparent_60%)]" />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.13] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Drifting highlight */}
        <motion.div
          aria-hidden
          animate={{ x: [0, 60, 0], y: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-20 top-0 h-96 w-96 rounded-full bg-orange-300/25 blur-[110px]"
        />

        <div className="relative flex flex-col items-center px-6 py-24 text-center sm:px-10 sm:py-32">
          <Reveal direction="up">
            <h2 className="max-w-3xl text-balance text-4xl font-bold leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Let&apos;s build something
              <br />
              worth shipping
            </h2>
          </Reveal>

          <Reveal direction="up" delay={0.1}>
            <p className="mt-6 max-w-xl text-pretty text-sm leading-relaxed text-white/75 sm:text-base">
              Whether it&apos;s a retrieval system that needs to get faster, a product that needs
              building end to end, or a story that needs telling on camera — I&apos;d love to hear
              about it.
            </p>
          </Reveal>

          <Reveal direction="up" delay={0.2}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <PillLink href="#contact" variant="light">
                Get in touch
              </PillLink>
              <PillLink href={`mailto:${profile.email}`} variant="outline">
                Email me directly
              </PillLink>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
