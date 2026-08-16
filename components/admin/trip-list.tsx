"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Database,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createTrip,
  deleteTrip,
  moveTrip,
  seedTrips,
  type ActionResult,
} from "@/lib/actions/trips";
import type { Trip } from "@/content/site";
import { cn } from "@/lib/utils";

export function TripList({ trips, seeded }: { trips: Trip[]; seeded: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  /**
   * Still two-step, even though delete now only moves the trip to the trash:
   * it disappears from the live site the moment you click, and that alone is
   * worth a beat of confirmation.
   */
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
              Trips not in Firestore yet
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">
              Seed to take control, then replace the placeholders with journeys you&apos;ve
              actually taken.
            </p>
          </div>
          <button
            onClick={() => run(seedTrips)}
            disabled={pending}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-[13px] font-semibold text-[var(--brand-ink)] transition-colors hover:bg-brand-400 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Seed trips
          </button>
        </div>
      ) : (
        <button
          onClick={() => run(createTrip)}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-panel-2 px-5 py-2.5 text-[13px] font-semibold text-zinc-200 transition-colors hover:border-brand-500/50 hover:text-brand-300 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          New trip
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

      {trips.length === 0 ? (
        <p className="rounded-2xl border border-white/8 bg-panel px-6 py-12 text-center text-sm text-zinc-500">
          No trips yet.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-white/8 bg-panel">
          {trips.map((trip, index) => (
            <li
              key={trip.id}
              className="flex items-center gap-3 border-b border-white/6 px-5 py-4 last:border-0"
            >
              <div className="flex flex-col">
                <button
                  onClick={() => run(() => moveTrip(trip.id, "up"), trip.id)}
                  disabled={pending || index === 0}
                  aria-label="Move up"
                  className="text-zinc-600 transition-colors hover:text-white disabled:opacity-25"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => run(() => moveTrip(trip.id, "down"), trip.id)}
                  disabled={pending || index === trips.length - 1}
                  aria-label="Move down"
                  className="text-zinc-600 transition-colors hover:text-white disabled:opacity-25"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{trip.destination}</p>
                <p className="truncate font-mono text-[11px] text-zinc-600">
                  {trip.region || "no region"} · {trip.days}d · {trip.lat.toFixed(2)},
                  {trip.lng.toFixed(2)}
                </p>
              </div>

              {busyId === trip.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
              ) : null}

              <Link
                href={`/admin/trips/${trip.id}`}
                className={cn(
                  "rounded-full border border-white/10 p-2 text-zinc-400 transition-colors hover:border-brand-500/50 hover:text-brand-300",
                  !seeded && "pointer-events-none opacity-40"
                )}
                aria-disabled={!seeded}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Link>

              {confirmId === trip.id ? (
                <button
                  onClick={() => run(() => deleteTrip(trip.id), trip.id)}
                  disabled={pending}
                  className="rounded-full bg-red-500 px-3 py-1.5 text-[11px] font-semibold text-white"
                >
                  Confirm
                </button>
              ) : (
                <button
                  onClick={() => setConfirmId(trip.id)}
                  disabled={pending || !seeded}
                  aria-label="Delete"
                  className="rounded-full border border-white/10 p-2 text-zinc-500 transition-colors hover:border-red-500/50 hover:text-red-400 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
