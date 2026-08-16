"use client";

import { Reveal } from "@/components/fx/reveal";
import { EmberBackdrop } from "@/components/fx/ember-backdrop";
import { PillLink } from "@/components/ui/primitives";
import { useProfile } from "@/components/providers/profile-provider";
import { useCopy } from "@/components/providers/copy-provider";

/**
 * Full-bleed closing panel — the loudest moment on the page, so it's the last
 * thing before the contact form.
 */
export function CallToAction() {
  const profile = useProfile();
  const copy = useCopy("cta");

  return (
    <section id="cta" className="relative scroll-mt-24 px-3 py-3 sm:px-5 lg:px-6">
      <div className="relative mx-auto w-full max-w-[100rem] overflow-hidden rounded-[1.75rem] border border-white/8">
        <EmberBackdrop />

        <div className="relative flex flex-col items-center px-6 py-24 text-center sm:px-10 sm:py-32">
          <Reveal direction="up">
            {/* White throughout — this panel already sits on the ember ground,
                where the accent would disappear into it. */}
            <h2 className="max-w-3xl text-balance text-4xl font-bold leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {copy.titleLead}
              <br />
              {copy.titleAccent}
            </h2>
          </Reveal>

          <Reveal direction="up" delay={0.1}>
            <p className="mt-6 max-w-xl text-pretty text-sm leading-relaxed text-white/75 sm:text-base">
              {copy.description}
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
