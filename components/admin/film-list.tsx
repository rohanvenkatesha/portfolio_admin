"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Database, Loader2, Plus, Save, Trash2 } from "lucide-react";
import {
  createFilm,
  deleteFilm,
  saveFilm,
  seedFilms,
  type ActionResult,
} from "@/lib/actions/films";
import type { Film } from "@/content/site";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-panel-2 px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20";

export function FilmList({ films, seeded }: { films: Film[]; seeded: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>) {
    setResult(null);
    startTransition(async () => {
      const outcome = await action();
      setResult(outcome);
      setConfirmId(null);
      if (outcome.ok) router.refresh();
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    run(() => saveFilm(formData));
  }

  return (
    <div className="space-y-4">
      {!seeded ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-500/25 bg-brand-500/[0.06] p-5">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <Database className="h-4 w-4 text-brand-400" />
              Films not in Firestore yet
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">
              Seed to take control, then swap in your real films and paste their video links.
            </p>
          </div>
          <button
            onClick={() => run(seedFilms)}
            disabled={pending}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-[13px] font-semibold text-[var(--brand-ink)] transition-colors hover:bg-brand-400 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Seed films
          </button>
        </div>
      ) : (
        <button
          onClick={() => run(createFilm)}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-panel-2 px-5 py-2.5 text-[13px] font-semibold text-zinc-200 transition-colors hover:border-brand-500/50 hover:text-brand-300 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          New film
        </button>
      )}

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
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {result.ok ? result.message : result.error}
        </p>
      ) : null}

      {/* Films are a small, flat shape, so they edit inline rather than on
          their own route the way projects and trips do. */}
      {films.map((film) => (
        <form
          key={film.id}
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-white/8 bg-panel p-6"
        >
          <input suppressHydrationWarning type="hidden" name="id" value={film.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <input suppressHydrationWarning name="title" defaultValue={film.title} placeholder="Title" className={inputClass} />
            <input
              suppressHydrationWarning
              name="role"
              defaultValue={film.role}
              placeholder="Role — Director / DP / Editor"
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <input suppressHydrationWarning name="year" defaultValue={film.year} placeholder="Year" className={inputClass} />
            <input
              suppressHydrationWarning
              name="runtime"
              defaultValue={film.runtime}
              placeholder="Runtime — 14:22"
              className={cn(inputClass, "font-mono")}
            />
          </div>

          <textarea
            suppressHydrationWarning
            name="synopsis"
            defaultValue={film.synopsis}
            rows={2}
            placeholder="Synopsis"
            className={cn(inputClass, "resize-none")}
          />

          <div>
            <input
              suppressHydrationWarning
              name="embedUrl"
              defaultValue={film.embedUrl ?? ""}
              placeholder="https://youtube.com/watch?v=… or https://vimeo.com/…"
              className={cn(inputClass, "font-mono text-[12px]")}
            />
            <p className="mt-1.5 text-[11px] text-zinc-600">
              Paste the normal watch URL — it&apos;s converted to the embed form on save. Leave
              empty to show the placeholder plate.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending || !seeded}
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-[13px] font-semibold text-[var(--brand-ink)] transition-colors hover:bg-brand-400 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>

            <div className="flex-1" />

            {confirmId === film.id ? (
              <button
                type="button"
                onClick={() => run(() => deleteFilm(film.id))}
                disabled={pending}
                className="rounded-full bg-red-500 px-4 py-2 text-[12px] font-semibold text-white"
              >
                Confirm delete
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmId(film.id)}
                disabled={pending || !seeded}
                aria-label="Delete film"
                className="rounded-full border border-white/10 p-2 text-zinc-500 transition-colors hover:border-red-500/50 hover:text-red-400 disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </form>
      ))}
    </div>
  );
}
