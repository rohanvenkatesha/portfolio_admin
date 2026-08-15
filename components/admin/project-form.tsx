"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import { saveProject, type ActionResult } from "@/lib/actions/projects";
import { ImagePicker } from "@/components/admin/image-picker";
import type { MediaFile } from "@/lib/content/media";
import { projectFilters, type Project } from "@/content/site";
import { cn } from "@/lib/utils";

const ACCENTS: Project["accent"][] = ["cyan", "violet", "amber", "lime", "rose"];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-panel-2 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20";

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <span className="mb-1.5 flex items-baseline justify-between gap-3">
      <span className="text-[12px] font-medium text-zinc-300">{children}</span>
      {hint ? <span className="text-[11px] text-zinc-600">{hint}</span> : null}
    </span>
  );
}

export function ProjectForm({ project, covers }: { project: Project; covers: MediaFile[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setResult(null);

    startTransition(async () => {
      const outcome = await saveProject(formData);
      setResult(outcome);
      if (outcome.ok) router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input suppressHydrationWarning type="hidden" name="id" value={project.id} />

      <div className="space-y-5 rounded-2xl border border-white/8 bg-panel p-6">
        <ImagePicker
          name="coverUrl"
          folder="projects"
          files={covers}
          initialSrc={project.coverUrl ?? ""}
          label="Cover image"
          hint="Shown on the card and at the top of its page"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <Label>Title</Label>
            <input suppressHydrationWarning name="title" defaultValue={project.title} className={inputClass} required />
          </label>

          <label className="block">
            <Label hint="lowercase, hyphens">Slug</Label>
            <input
              suppressHydrationWarning
              name="slug"
              defaultValue={project.slug}
              pattern="[a-z0-9\-]+"
              className={cn(inputClass, "font-mono")}
              required
            />
          </label>
        </div>

        <label className="block">
          <Label hint="one or two sentences">Blurb</Label>
          <textarea
            suppressHydrationWarning
            name="blurb"
            defaultValue={project.blurb}
            rows={3}
            className={cn(inputClass, "resize-none")}
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-3">
          <label className="block">
            <Label>Category</Label>
            <select suppressHydrationWarning name="category" defaultValue={project.category} className={inputClass}>
              {projectFilters
                .filter((f) => f !== "All")
                .map((category) => (
                  <option key={category} value={category} className="bg-panel-2">
                    {category}
                  </option>
                ))}
            </select>
          </label>

          <label className="block">
            <Label hint="card cover">Accent</Label>
            <select suppressHydrationWarning name="accent" defaultValue={project.accent} className={inputClass}>
              {ACCENTS.map((accent) => (
                <option key={accent} value={accent} className="bg-panel-2">
                  {accent}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <Label hint="optional">Year</Label>
            <input
              suppressHydrationWarning
              name="year"
              defaultValue={project.year ?? ""}
              placeholder="2025"
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <Label hint="one per line">Stack</Label>
            <textarea
              suppressHydrationWarning
              name="stack"
              defaultValue={project.stack.join("\n")}
              rows={6}
              className={cn(inputClass, "resize-none font-mono text-[12px]")}
            />
          </label>

          <label className="block">
            <Label hint="one per line">Highlights</Label>
            <textarea
              suppressHydrationWarning
              name="highlights"
              defaultValue={project.highlights.join("\n")}
              rows={6}
              className={cn(inputClass, "resize-none text-[12px]")}
            />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <Label hint="optional">Repository URL</Label>
            <input
              suppressHydrationWarning
              name="repo"
              type="url"
              defaultValue={project.repo ?? ""}
              placeholder="https://github.com/…"
              className={cn(inputClass, "font-mono text-[12px]")}
            />
          </label>

          <label className="block">
            <Label hint="optional">Live demo URL</Label>
            <input
              suppressHydrationWarning
              name="demo"
              type="url"
              defaultValue={project.demo ?? ""}
              placeholder="https://…"
              className={cn(inputClass, "font-mono text-[12px]")}
            />
          </label>
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-panel-2 px-4 py-3.5">
          <input
            suppressHydrationWarning
            type="checkbox"
            name="featured"
            defaultChecked={Boolean(project.featured)}
            className="h-4 w-4 accent-brand-500"
          />
          <span className="text-[13px] text-zinc-300">
            Featured
            <span className="ml-2 text-[11px] text-zinc-600">
              shown first on the home page and in the footer
            </span>
          </span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-[var(--brand-ink)] transition-colors hover:bg-brand-400 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {pending ? "Saving…" : "Save changes"}
        </button>

        {result ? (
          <p
            role="status"
            className={cn(
              "flex items-center gap-2 text-[13px]",
              result.ok ? "text-emerald-300" : "text-red-300"
            )}
          >
            {result.ok ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {result.ok ? result.message : result.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
