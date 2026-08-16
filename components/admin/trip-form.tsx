"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import { saveTrip, type ActionResult } from "@/lib/actions/trips";
import { ImagePicker } from "@/components/admin/image-picker";
import type { MediaFile } from "@/lib/content/media";
import type { Trip } from "@/content/site";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-panel-2 px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[12px] font-medium text-zinc-300">{label}</span>
        {hint ? <span className="text-[11px] text-zinc-600">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export function TripForm({ trip, covers = [] }: { trip: Trip; covers?: MediaFile[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setResult(null);
    startTransition(async () => {
      const outcome = await saveTrip(formData);
      setResult(outcome);
      if (outcome.ok) router.refresh();
    });
  }

  // One day per line, pipe-separated — see parseItinerary in the action.
  const itineraryText = trip.itinerary
    .map((day) => [day.day, day.title, day.detail].join(" | "))
    .join("\n");

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input suppressHydrationWarning type="hidden" name="id" value={trip.id} />

      {/* Cover */}
      <div className="rounded-2xl border border-white/8 bg-panel p-6">
        <ImagePicker
          name="coverUrl"
          folder="trips"
          files={covers}
          initialSrc={trip.coverUrl ?? ""}
          label="Cover photo"
          hint="Committed under public/media/trips"
        />
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
          Shown on the archive card, the hover preview and the top of the guide. Leave it empty and
          all three fall back to this trip&apos;s gradient.
        </p>
      </div>

      {/* Identity */}
      <div className="space-y-5 rounded-2xl border border-white/8 bg-panel p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Destination">
            <input suppressHydrationWarning name="destination" defaultValue={trip.destination} className={inputClass} required />
          </Field>
          <Field label="Slug" hint="lowercase, hyphens">
            <input
              suppressHydrationWarning
              name="slug"
              defaultValue={trip.slug}
              pattern="[a-z0-9\-]+"
              className={cn(inputClass, "font-mono")}
              required
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Region" hint="e.g. India · Himalaya">
            <input suppressHydrationWarning name="region" defaultValue={trip.region} className={inputClass} />
          </Field>
          <Field label="Vibe" hint="three words">
            <input suppressHydrationWarning name="vibe" defaultValue={trip.vibe} className={inputClass} />
          </Field>
        </div>

        <Field label="Hook" hint="the one-line pitch">
          <textarea suppressHydrationWarning name="hook" defaultValue={trip.hook} rows={2} className={cn(inputClass, "resize-none")} />
        </Field>
      </div>

      {/* Numbers */}
      <div className="space-y-5 rounded-2xl border border-white/8 bg-panel p-6">
        <p className="text-[12px] font-medium text-zinc-300">
          Coordinates &amp; figures
          <span className="ml-2 text-[11px] font-normal text-zinc-600">
            lat/lng place the pin on the globe — they must be real
          </span>
        </p>

        <div className="grid gap-5 sm:grid-cols-4">
          <Field label="Latitude" hint="-90…90">
            <input
              suppressHydrationWarning
              name="lat"
              type="number"
              step="any"
              defaultValue={trip.lat}
              className={cn(inputClass, "font-mono")}
              required
            />
          </Field>
          <Field label="Longitude" hint="-180…180">
            <input
              suppressHydrationWarning
              name="lng"
              type="number"
              step="any"
              defaultValue={trip.lng}
              className={cn(inputClass, "font-mono")}
              required
            />
          </Field>
          <Field label="Year">
            <input suppressHydrationWarning name="year" defaultValue={trip.year} className={inputClass} />
          </Field>
          <Field label="Days">
            <input suppressHydrationWarning name="days" type="number" min="0" defaultValue={trip.days} className={inputClass} />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Distance (km)">
            <input
              suppressHydrationWarning
              name="distanceKm"
              type="number"
              min="0"
              defaultValue={trip.distanceKm}
              className={inputClass}
            />
          </Field>
          <Field label="Budget" hint="free text">
            <input suppressHydrationWarning name="budget" defaultValue={trip.budget} className={inputClass} />
          </Field>
        </div>
      </div>

      {/* The guide */}
      <div className="space-y-5 rounded-2xl border border-white/8 bg-panel p-6">
        <Field label="Itinerary" hint="one day per line:  Day 1-3 | Title | Detail">
          <textarea
            suppressHydrationWarning
            name="itinerary"
            defaultValue={itineraryText}
            rows={8}
            placeholder="Day 1-3 | Acclimatise | Be boring for 72 hours. Walk, drink water, sleep badly."
            className={cn(inputClass, "resize-y font-mono text-[12px] leading-relaxed")}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Gear" hint="one per line">
            <textarea
              suppressHydrationWarning
              name="gear"
              defaultValue={trip.gear.join("\n")}
              rows={7}
              className={cn(inputClass, "resize-y text-[12px]")}
            />
          </Field>
          <Field label="Solo tips" hint="one per line">
            <textarea
              suppressHydrationWarning
              name="tips"
              defaultValue={trip.tips.join("\n")}
              rows={7}
              className={cn(inputClass, "resize-y text-[12px]")}
            />
          </Field>
        </div>

        <Field label="Reflection" hint="the closing paragraph">
          <textarea
            suppressHydrationWarning
            name="reflection"
            defaultValue={trip.reflection}
            rows={4}
            className={cn(inputClass, "resize-y")}
          />
        </Field>
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
            {result.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {result.ok ? result.message : result.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
