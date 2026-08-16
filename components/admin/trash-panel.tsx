"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, MapPin, NotebookPen, RotateCcw, Trash2 } from "lucide-react";
import { restorePost, purgePost, type ActionResult } from "@/lib/actions/posts";
import { restoreTrip, purgeTrip } from "@/lib/actions/trips";
import { cn } from "@/lib/utils";

/**
 * The trash, for trips and posts.
 *
 * Only these two are soft-deleted. A photo or a film is a row of metadata
 * pointing at a file that's still in the repo — retyping it is a minute's work.
 * A trip is an itinerary and a post is an evening of writing, and both used to
 * be one mis-click from gone with nothing to recover from.
 *
 * Deliberately not automatic: nothing empties itself on a timer, because a
 * portfolio is edited in bursts months apart and a thirty-day sweep would fire
 * while nobody was looking.
 */

export type TrashEntry = {
  id: string;
  kind: "trip" | "post";
  title: string;
  /** The line under the title — trip region, or the post's owning trip. */
  detail: string;
  deletedAt: string;
};

/** "3 days ago" beats a timestamp for the only question asked here: how long. */
function since(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "just now";

  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return `${Math.floor(days / 30)}mo ago`;
}

export function TrashPanel({ entries }: { entries: TrashEntry[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  /** Two-step, because from here delete really is the end of it. */
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>, id: string) {
    setBusyId(id);
    setResult(null);
    startTransition(async () => {
      const outcome = await action();
      setResult(outcome);
      setBusyId(null);
      setConfirmId(null);
      if (outcome.ok) router.refresh();
    });
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-panel px-6 py-14 text-center">
        <Trash2 className="mx-auto h-5 w-5 text-zinc-700" />
        <p className="mt-3 text-sm font-medium text-zinc-400">The trash is empty</p>
        <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-zinc-600">
          Deleted trips and posts land here instead of disappearing. Nothing is removed on a timer —
          it stays until you empty it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      <ul className="overflow-hidden rounded-2xl border border-white/8 bg-panel">
        {entries.map((entry) => {
          const Icon = entry.kind === "trip" ? MapPin : NotebookPen;
          const restore = () =>
            run(
              () => (entry.kind === "trip" ? restoreTrip(entry.id) : restorePost(entry.id)),
              entry.id
            );
          const purge = () =>
            run(
              () => (entry.kind === "trip" ? purgeTrip(entry.id) : purgePost(entry.id)),
              entry.id
            );

          return (
            <li
              key={`${entry.kind}-${entry.id}`}
              // Wraps to two rows on a phone rather than crushing the title:
              // the buttons keep their tap targets and drop to their own line.
              className="flex flex-wrap items-center gap-x-3 gap-y-3 border-b border-white/6 px-4 py-4 last:border-0 sm:px-5"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-600" />

              <div className="min-w-0 flex-1 basis-40">
                <p className="truncate text-sm font-medium text-zinc-300">{entry.title}</p>
                <p className="truncate font-mono text-[11px] text-zinc-600">
                  {entry.kind} · {entry.detail} · deleted {since(entry.deletedAt)}
                </p>
              </div>

              {busyId === entry.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
              ) : null}

              <div className="ml-auto flex shrink-0 items-center gap-2">
                <button
                  onClick={restore}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-brand-500/50 hover:text-brand-300 disabled:opacity-40"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restore
                </button>

                {confirmId === entry.id ? (
                  <button
                    onClick={purge}
                    disabled={pending}
                    className="rounded-full bg-red-500 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60"
                  >
                    Delete for good
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmId(entry.id)}
                    disabled={pending}
                    aria-label={`Permanently delete ${entry.title}`}
                    className="rounded-full border border-white/10 p-2 text-zinc-500 transition-colors hover:border-red-500/50 hover:text-red-400 disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-[12px] leading-relaxed text-zinc-600">
        Restoring brings a post back as a draft — after time in the trash you should decide it&apos;s
        ready, rather than have it reappear on the live site.
      </p>
    </div>
  );
}
