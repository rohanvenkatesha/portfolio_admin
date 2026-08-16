"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Code2, Palette, Plus, Quote, Sparkles } from "lucide-react";
import { Reveal, RevealGroup, RevealItem, SectionHeading } from "@/components/fx/reveal";
import { EmberBackdrop } from "@/components/fx/ember-backdrop";
import { philosophy, skillGroups } from "@/content/site";
import { useProfile } from "@/components/providers/profile-provider";
import { cn } from "@/lib/utils";
import { useCopy } from "@/components/providers/copy-provider";

type Domain = "all" | "engineering" | "creative";

const DOMAINS: { id: Domain; label: string; icon: typeof Code2 }[] = [
  { id: "all", label: "Everything", icon: Sparkles },
  { id: "engineering", label: "Engineering", icon: Code2 },
  { id: "creative", label: "Creative", icon: Palette },
];

export function About() {
  const copy = useCopy("about");
  const profile = useProfile();
  const [domain, setDomain] = useState<Domain>("all");
  const [openGroup, setOpenGroup] = useState<string>(skillGroups[0].id);

  const groups = useMemo(
    () => (domain === "all" ? skillGroups : skillGroups.filter((g) => g.domain === domain)),
    [domain]
  );

  return (
    <section id="about" className="relative scroll-mt-24 px-3 py-3 sm:px-5 lg:px-6">
      <div className="relative mx-auto w-full max-w-[100rem] overflow-hidden rounded-[1.75rem] border border-white/8 bg-panel px-6 py-14 sm:px-10 sm:py-16 lg:px-14">
        <SectionHeading
          eyebrow={copy.eyebrow}
          title={
            <>
              {copy.titleLead}
              <br />
              <span className="text-brand-500">{copy.titleAccent}</span>
            </>
          }
          description={copy.description}
        />

        {/* ---------------- Narrative + principles ---------------- */}
        <div className="mt-12 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          {/* The personal statement carries the ember treatment — it's the one
              piece of first-person writing on the page, so it earns the weight.
              Palette inverts to white-alpha; the orange accent would vanish. */}
          <Reveal direction="right">
            <div className="relative h-full overflow-hidden rounded-2xl border border-white/8">
              <EmberBackdrop drift={false} />

              <div className="relative flex h-full flex-col p-8">
                <Quote className="h-7 w-7 text-white/50" />
                <p className="mt-6 whitespace-pre-line text-[15px] leading-relaxed text-white/85">
                  {profile.bio}
                </p>

                <div className="mt-auto flex items-center gap-3 border-t border-white/20 pt-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-mono text-xs font-bold text-brand-600">
                    {profile.initials}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{profile.name}</p>
                    <p className="text-[11px] text-white/60">{profile.location}</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Numbered principle cards */}
          <RevealGroup className="grid gap-4 sm:grid-cols-2" stagger={0.08}>
            {philosophy.map((item, index) => (
              <RevealItem key={item.title}>
                <article className="group relative h-full overflow-hidden rounded-2xl border border-white/8 bg-panel-2 p-6 transition-colors duration-500 hover:border-brand-500/40">
                  {/* Warm wash rises on hover */}
                  <span
                    aria-hidden
                    className="absolute inset-0 origin-bottom scale-y-0 bg-gradient-to-t from-brand-500/10 to-transparent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100"
                  />

                  <div className="relative">
                    <span className="font-mono text-2xl font-bold text-brand-500 transition-transform duration-500 group-hover:-translate-y-0.5">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                    <p className="mt-2.5 text-[13px] leading-relaxed text-zinc-400">{item.body}</p>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        {/* ---------------- Skill rows ---------------- */}
        <div className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              What I work with
            </h3>

            {/**
             * Full-width segmented control on phones, hugging pill from `sm`.
             *
             * "Everything / Engineering / Creative" plus their icons measured
             * 378px against a 301px column, so the last button was cut off. The
             * labels carry the meaning here, so below `sm` the icons step aside
             * and the three buttons split the row evenly.
             */}
            <div className="flex w-full gap-1 rounded-full border border-white/8 bg-panel-2 p-1.5 sm:inline-flex sm:w-auto">
              {DOMAINS.map(({ id, label, icon: Icon }) => {
                const active = domain === id;
                return (
                  <button
                    key={id}
                    onClick={() => setDomain(id)}
                    className={cn(
                      "relative inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-2 py-2 text-[13px] font-medium transition-colors sm:flex-none sm:px-4",
                      active ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="domain-pill"
                        className="absolute inset-0 rounded-full bg-brand-500"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    ) : null}
                    <Icon className="relative z-10 hidden h-3.5 w-3.5 sm:block" />
                    <span className="relative z-10">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 border-t border-white/8">
            {groups.map((group, index) => {
              const open = openGroup === group.id;
              return (
                <motion.div
                  key={group.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  onMouseEnter={() => setOpenGroup(group.id)}
                  className="border-b border-white/8"
                >
                  <button
                    onClick={() => setOpenGroup(open ? "" : group.id)}
                    onFocus={() => setOpenGroup(group.id)}
                    aria-expanded={open}
                    className="group relative block w-full overflow-hidden px-4 py-6 text-left"
                  >
                    {/* Orange wash wipes in from the left */}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-0 origin-left bg-gradient-to-r from-brand-500/12 to-transparent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                        open ? "scale-x-100" : "scale-x-0"
                      )}
                    />

                    <div className="relative flex items-center gap-5">
                      <span
                        className={cn(
                          "font-mono text-[11px] transition-colors duration-300",
                          open ? "text-brand-500" : "text-zinc-600"
                        )}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <h4
                        className={cn(
                          "flex-1 text-lg font-semibold transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:text-xl",
                          open ? "translate-x-2 text-brand-400" : "text-white"
                        )}
                      >
                        {group.label}
                      </h4>

                      <span className="font-mono text-[11px] text-zinc-600">
                        {group.skills.length}
                      </span>

                      <Plus
                        className={cn(
                          "h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                          open && "rotate-45 text-brand-500"
                        )}
                      />
                    </div>

                    {/* Skills expand with staggered bars */}
                    <AnimatePresence initial={false}>
                      {open ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className="relative overflow-hidden"
                        >
                          <div className="grid gap-x-10 gap-y-4 pt-6 sm:grid-cols-2 sm:pl-9">
                            {group.skills.map((skill, i) => (
                              <motion.div
                                key={skill.name}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.06 * i, duration: 0.4 }}
                              >
                                <div className="flex items-baseline justify-between gap-3">
                                  <span className="text-[13px] text-zinc-300">{skill.name}</span>
                                  <span className="font-mono text-[10px] text-zinc-600">
                                    {skill.level}
                                  </span>
                                </div>
                                <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-white/8">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${skill.level}%` }}
                                    transition={{
                                      duration: 0.9,
                                      delay: 0.06 * i,
                                      ease: [0.16, 1, 0.3, 1],
                                    }}
                                    className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
                                  />
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
