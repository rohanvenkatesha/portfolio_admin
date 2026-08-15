"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Database, Loader2, Pencil, Star } from "lucide-react";
import { seedProjects, toggleFeatured, type ActionResult } from "@/lib/actions/projects";
import type { Project } from "@/content/site";
import { cn } from "@/lib/utils";

export function ProjectList({ projects, seeded }: { projects: Project[]; seeded: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  /** Which row is mid-toggle, so only that row shows a spinner. */
  const [busyId, setBusyId] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>, id?: string) {
    setBusyId(id ?? null);
    setResult(null);
    startTransition(async () => {
      const outcome = await action();
      setResult(outcome);
      setBusyId(null);
      // Pull the server's new state rather than guessing it locally.
      if (outcome.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Seed */}
      {!seeded ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-500/25 bg-brand-500/[0.06] p-5">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <Database className="h-4 w-4 text-brand-400" />
              Firestore is empty
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">
              Copy the {projects.length} projects from the repo into Firestore. This runs once and
              refuses to overwrite existing data.
            </p>
          </div>

          <button
            onClick={() => run(seedProjects)}
            disabled={pending}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-[13px] font-semibold text-[var(--brand-ink)] transition-colors hover:bg-brand-400 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Seed Firestore
          </button>
        </div>
      ) : null}

      {/* Result banner */}
      {result ? (
        <p
          role="status"
          className={cn(
            "flex items-start gap-2 rounded-xl border p-3.5 text-[13px] leading-relaxed",
            result.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          )}
        >
          {result.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {result.ok ? result.message : result.error}
        </p>
      ) : null}

      {/* Rows */}
      <ul className="overflow-hidden rounded-2xl border border-white/8 bg-panel">
        {projects.map((project, index) => (
          <li
            key={project.id}
            className="flex items-center gap-4 border-b border-white/6 px-5 py-4 last:border-0"
          >
            <span className="w-6 shrink-0 font-mono text-[11px] text-zinc-600">
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{project.title}</p>
              <p className="truncate font-mono text-[11px] text-zinc-600">
                {project.category} · /work/{project.slug}
              </p>
            </div>

            <button
              onClick={() => run(() => toggleFeatured(project.id), project.id)}
              disabled={pending || !seeded}
              title={
                seeded
                  ? project.featured
                    ? "Featured on the home page"
                    : "Not featured"
                  : "Seed Firestore to enable editing"
              }
              aria-pressed={Boolean(project.featured)}
              className={cn(
                "rounded-full border p-2 transition-colors disabled:opacity-40",
                project.featured
                  ? "border-brand-500/50 bg-brand-500/15 text-brand-300"
                  : "border-white/10 text-zinc-600 hover:text-zinc-300"
              )}
            >
              {busyId === project.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Star className={cn("h-3.5 w-3.5", project.featured && "fill-current")} />
              )}
            </button>

            <Link
              href={`/admin/projects/${project.id}`}
              className={cn(
                "rounded-full border border-white/10 p-2 text-zinc-400 transition-colors hover:border-brand-500/50 hover:text-brand-300",
                !seeded && "pointer-events-none opacity-40"
              )}
              aria-disabled={!seeded}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
