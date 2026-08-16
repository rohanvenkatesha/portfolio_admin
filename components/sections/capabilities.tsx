"use client";

import { Reveal, RevealGroup, RevealItem } from "@/components/fx/reveal";
import { Counter } from "@/components/fx/effects";
import { EmberBackdrop } from "@/components/fx/ember-backdrop";
import { PillLink, TechBadge } from "@/components/ui/primitives";
import { useLists } from "@/components/providers/lists-provider";
import { useCopy } from "@/components/providers/copy-provider";

/**
 * Two panels under the hero: what I'm hired to do, and the numbers behind it.
 *
 * The numbers panel carries the warm ember treatment — the same one as the
 * closing call to action. Used twice on the page, it reads as emphasis; the
 * neutral panels either side are what make it land.
 */
export function Capabilities() {
  // `stats` is already the numbers themselves, so the copy for that panel is
  // `numbers` here to avoid shadowing it.
  const services = useCopy("capabilities");
  const numbers = useCopy("stats");
  const { capabilities, stats } = useLists();

  return (
    <section id="capabilities" className="relative scroll-mt-24 px-3 py-3 sm:px-5 lg:px-6">
      <div className="mx-auto grid w-full max-w-[100rem] gap-3 lg:grid-cols-[1.55fr_1fr]">
        {/* ---------------- What I do ---------------- */}
        <div className="rounded-[1.75rem] border border-white/8 bg-panel p-7 sm:p-10">
          <Reveal direction="up">
            {/* Both lines stay white here — this panel doesn't accent its
                second line the way the SectionHeading sections do. */}
            <h2 className="max-w-xl text-balance text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-4xl">
              {services.titleLead}
              <br />
              {services.titleAccent}
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-400">
              {services.description}
            </p>
          </Reveal>

          <RevealGroup className="mt-9 grid gap-3 sm:grid-cols-3" stagger={0.1}>
            {capabilities.map((capability) => (
              <RevealItem key={capability.number}>
                <article className="group flex h-full flex-col rounded-2xl border border-white/6 bg-panel-2 p-6 transition-colors duration-300 hover:border-brand-500/40">
                  <span className="font-mono text-3xl font-bold text-brand-500 transition-transform duration-300 group-hover:-translate-y-0.5">
                    {capability.number}
                  </span>

                  <h3 className="mt-5 text-base font-semibold text-white">{capability.title}</h3>
                  <p className="mt-2.5 flex-1 text-[13px] leading-relaxed text-zinc-400">
                    {capability.body}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {capability.tags.map((tag) => (
                      <TechBadge key={tag}>{tag}</TechBadge>
                    ))}
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        {/* ---------------- Numbers ---------------- */}
        <div className="relative overflow-hidden rounded-[1.75rem] border border-white/8">
          {/* No drift on a panel this size — a moving bloom in a narrow column
              reads as distraction rather than depth. */}
          <EmberBackdrop drift={false} />

          {/* On the warm ground the palette inverts: white and white-alpha
              throughout, since the orange accent would vanish into it. */}
          <div className="relative flex h-full flex-col justify-between p-7 sm:p-10">
            <Reveal direction="up">
              <h2 className="text-balance text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-4xl">
                {numbers.titleLead}
                <br />
                {numbers.titleAccent}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/70">{numbers.description}</p>
            </Reveal>

            <dl className="mt-9 space-y-6">
              {stats.map((stat, index) => (
                <Reveal key={stat.label} direction="left" delay={index * 0.08}>
                  <div className="flex items-baseline justify-between gap-4 border-b border-white/20 pb-5 last:border-0">
                    <dd className="font-mono text-4xl font-bold tracking-tight text-white sm:text-5xl">
                      <Counter value={stat.value} suffix={stat.suffix} />
                    </dd>
                    <dt className="max-w-[9rem] text-right text-[13px] leading-tight text-white/70">
                      {stat.label}
                    </dt>
                  </div>
                </Reveal>
              ))}
            </dl>

            <Reveal direction="up" delay={0.2} className="mt-8">
              <PillLink href="#work" variant="light">
                See the work
              </PillLink>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
