import Image from "next/image";
import { ArrowUpRight, Boxes, ExternalLink } from "lucide-react";
import { Badge, TechBadge } from "@/components/ui/primitives";
import { GithubIcon } from "@/components/ui/brand-icons";
import type { Project } from "@/content/site";
import { cn } from "@/lib/utils";

export const statusAccent = {
  Shipped: "emerald",
  Active: "cyan",
  Research: "violet",
} as const;

export const categoryAccent: Record<Project["category"], "cyan" | "lime" | "violet" | "amber"> = {
  "AI & ML": "cyan",
  "Full Stack": "lime",
  Systems: "violet",
  "Data & Research": "amber",
};

/**
 * The full write-up for a project.
 *
 * Free of any Dialog primitives so the same markup serves both the modal on the
 * home page and the standalone /work/[slug] route. Headings are plain elements;
 * the modal supplies its own visually-hidden DialogTitle.
 *
 * Status, year, metrics and architecture are all optional — sections simply
 * don't render when the data isn't there, rather than showing empty scaffolding.
 */
export function ProjectDetail({
  project,
  headingLevel = "h2",
  className,
}: {
  project: Project;
  headingLevel?: "h1" | "h2";
  className?: string;
}) {
  const Heading = headingLevel;

  return (
    <div className={className}>
      {/* Cover, when one has been uploaded */}
      {project.coverUrl ? (
        <div className="relative aspect-[21/9] w-full overflow-hidden border-b border-white/10">
          <Image
            src={project.coverUrl}
            alt=""
            fill
            priority={headingLevel === "h1"}
            sizes="(max-width: 1024px) 100vw, 900px"
            className="object-cover"
          />
          {/* Scrim so the header below reads as one piece with the image */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-transparent to-transparent" />
        </div>
      ) : null}

      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-brand-500/20 blur-[80px]" />

        <div className="relative flex flex-wrap items-center gap-2.5">
          {project.status ? (
            <Badge accent={statusAccent[project.status]}>{project.status}</Badge>
          ) : null}
          <Badge accent={categoryAccent[project.category]}>{project.category}</Badge>
          {project.year ? (
            <span className="font-mono text-[11px] text-zinc-500">{project.year}</span>
          ) : null}
        </div>

        <Heading
          className={cn(
            "relative mt-4 font-bold tracking-tight text-white",
            headingLevel === "h1" ? "text-3xl sm:text-5xl" : "text-2xl sm:text-3xl"
          )}
        >
          {project.title}
        </Heading>

        <p className="relative mt-3 max-w-2xl text-base leading-relaxed text-zinc-400">
          {project.blurb}
        </p>

        <div className="relative mt-6 flex flex-wrap gap-2">
          {project.repo ? (
            <a
              href={project.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-[var(--brand-ink)] transition-all hover:bg-brand-400"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              View source
            </a>
          ) : null}
          {project.demo ? (
            <a
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition-all hover:border-brand-400/50 hover:text-brand-200"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Live demo
            </a>
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div className="space-y-8 p-8 sm:p-10">
        {project.metrics?.length ? (
          <dl className="grid grid-cols-3 gap-4">
            {project.metrics.map((metric) => (
              <div key={metric.label} className="glass rounded-xl p-4">
                <dd className="font-mono text-xl font-bold text-white sm:text-2xl">
                  {metric.value}
                </dd>
                <dt className="mt-1 text-[11px] leading-tight text-zinc-500">{metric.label}</dt>
              </div>
            ))}
          </dl>
        ) : null}

        {project.architecture ? (
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Boxes className="h-4 w-4 text-brand-400" />
              Architecture
            </h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-400">
              {project.architecture}
            </p>
          </section>
        ) : null}

        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <ArrowUpRight className="h-4 w-4 text-brand-400" />
            What it does
          </h3>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {project.highlights.map((highlight) => (
              <li
                key={highlight}
                className="flex gap-2.5 rounded-lg border border-white/8 bg-white/[0.02] p-3 text-sm text-zinc-300"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                <span className="leading-relaxed">{highlight}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-white">Stack</h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.stack.map((tech) => (
              <TechBadge key={tech}>{tech}</TechBadge>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
