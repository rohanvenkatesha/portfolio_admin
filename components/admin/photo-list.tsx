"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronDown, ChevronUp, Database, Loader2, Trash2 } from "lucide-react";
import { deletePhoto, movePhoto, seedPhotos, type ActionResult } from "@/lib/actions/photos";
import type { Photo } from "@/content/site";
import { cn } from "@/lib/utils";

export function PhotoList({ photos, seeded }: { photos: Photo[]; seeded: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  /** Two-step delete, so one stray click can't remove a frame. */
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>, id?: string) {
    setBusyId(id ?? null);
    setResult(null);
    startTransition(async () => {
      const outcome = await action();
      setResult(outcome);
      setBusyId(null);
      setConfirmId(null);
      if (outcome.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {!seeded ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-500/25 bg-brand-500/[0.06] p-5">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <Database className="h-4 w-4 text-brand-400" />
              Gallery not in Firestore yet
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">
              Seed it to take control of the gallery. You can then delete the placeholders and
              upload real frames.
            </p>
          </div>
          <button
            onClick={() => run(seedPhotos)}
            disabled={pending}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-[13px] font-semibold text-[var(--brand-ink)] transition-colors hover:bg-brand-400 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Seed gallery
          </button>
        </div>
      ) : null}

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

      {photos.length === 0 ? (
        <p className="rounded-2xl border border-white/8 bg-panel px-6 py-12 text-center text-sm text-zinc-500">
          No frames yet. Upload one above.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              className="overflow-hidden rounded-2xl border border-white/8 bg-panel"
            >
              <div className="relative aspect-[4/3] bg-panel-2">
                {photo.src ? (
                  <Image
                    src={photo.src}
                    alt={photo.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className={cn("absolute inset-0 bg-gradient-to-br", photo.gradient)}>
                    <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400">
                      placeholder
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <p className="truncate text-sm font-medium text-white">{photo.title}</p>
                <p className="truncate text-[11px] text-zinc-600">
                  {photo.location || "No location"} · {photo.span}
                </p>

                <div className="mt-3 flex items-center gap-1.5">
                  <button
                    onClick={() => run(() => movePhoto(photo.id, "up"), photo.id)}
                    disabled={pending || index === 0}
                    aria-label="Move earlier"
                    className="rounded-lg border border-white/10 p-1.5 text-zinc-500 transition-colors hover:text-white disabled:opacity-30"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => run(() => movePhoto(photo.id, "down"), photo.id)}
                    disabled={pending || index === photos.length - 1}
                    aria-label="Move later"
                    className="rounded-lg border border-white/10 p-1.5 text-zinc-500 transition-colors hover:text-white disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex-1" />

                  {confirmId === photo.id ? (
                    <button
                      onClick={() => run(() => deletePhoto(photo.id), photo.id)}
                      disabled={pending}
                      className="rounded-lg bg-red-500 px-3 py-1.5 text-[11px] font-semibold text-white"
                    >
                      {busyId === photo.id ? "Removing…" : "Confirm"}
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmId(photo.id)}
                      disabled={pending}
                      aria-label="Remove"
                      className="rounded-lg border border-white/10 p-1.5 text-zinc-500 transition-colors hover:border-red-500/50 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
