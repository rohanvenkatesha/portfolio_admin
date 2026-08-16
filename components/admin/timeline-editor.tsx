"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { resetTimeline, saveTimeline, type ActionResult } from "@/lib/actions/timeline";
import {
  KIND_LABELS,
  TIMELINE_KINDS,
  TIMELINE_TRACKS,
  TRACK_LABELS,
  startYear,
  type TimelineEntry,
} from "@/content/timeline";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-panel-2 px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
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

/**
 * The Journey timeline.
 *
 * One card per entry, in the order they appear on the page. Highlights are a
 * textarea, one bullet a line — a repeater for them would be slower to write
 * and much slower to reorder, which is the trade the trip itinerary editor
 * already makes.
 */
export function TimelineEditor({ initial }: { initial: TimelineEntry[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [entries, setEntries] = useState<TimelineEntry[]>(initial);
  /** Bumped after a reset so every uncontrolled input re-reads its default. */
  const [version, setVersion] = useState(0);
  /** Mirrors just the period, so the year warning can update as you type. */
  const [periods, setPeriods] = useState<string[]>(initial.map((e) => e.period));

  function move(from: number, delta: number) {
    const to = from + delta;
    if (to < 0 || to >= entries.length) return;
    setEntries((list) => {
      const next = [...list];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
    setPeriods((list) => {
      const next = [...list];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }

  function remove(index: number) {
    setEntries((list) => list.filter((_, i) => i !== index));
    setPeriods((list) => list.filter((_, i) => i !== index));
  }

  function add() {
    setEntries((list) => [
      ...list,
      {
        id: `tl-${Date.now().toString(36)}`,
        track: "tech",
        kind: "work",
        period: String(new Date().getFullYear()),
        title: "",
        org: "",
        summary: "",
        highlights: [],
        stack: [],
      },
    ]);
    setPeriods((list) => [...list, String(new Date().getFullYear())]);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setResult(null);
    startTransition(async () => {
      const outcome = await saveTimeline(formData);
      setResult(outcome);
      if (outcome.ok) router.refresh();
    });
  }

  const byTrack = TIMELINE_TRACKS.map((track) => ({
    track,
    count: entries.filter((e) => e.track === track).length,
  }));

  return (
    <form key={version} onSubmit={onSubmit} className="space-y-5">
      {/* Counts per track, so it's obvious when one is empty */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-panel px-6 py-4">
        <div className="flex flex-wrap gap-4">
          {byTrack.map(({ track, count }) => (
            <span key={track} className="text-[12px] text-zinc-500">
              <span className="font-mono text-base font-bold text-white">{count}</span>{" "}
              {TRACK_LABELS[track]}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3.5 py-2 text-[12px] font-medium text-zinc-400 transition-colors hover:border-white/30 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          Add entry
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/15 bg-panel px-6 py-10 text-center text-[12px] text-zinc-600">
          No entries. The Journey section will be empty — turn it off in the section manager if
          that&apos;s intended.
        </p>
      ) : null}

      {entries.map((entry, index) => {
        const period = periods[index] ?? entry.period;
        const year = startYear(period);

        return (
          <section key={entry.id} className="rounded-2xl border border-white/8 bg-panel p-6">
            <input type="hidden" name="tlId" value={entry.id} />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-2.5">
                {/* The oversized ghost numeral on the card is this year */}
                <span className="font-mono text-2xl font-bold text-white/15">{year || "----"}</span>
                <span className="font-mono text-[11px] text-zinc-600">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </span>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 text-zinc-500 transition-colors hover:border-white/30 hover:text-white disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={index === entries.length - 1}
                  onClick={() => move(index, 1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 text-zinc-500 transition-colors hover:border-white/30 hover:text-white disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Remove entry"
                  onClick={() => remove(index)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 text-zinc-500 transition-colors hover:border-red-500/50 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                <Field label="Title" hint="Role, degree or milestone">
                  <input
                    suppressHydrationWarning
                    name="tlTitle"
                    defaultValue={entry.title}
                    className={inputClass}
                  />
                </Field>
                <Field label="Organisation">
                  <input
                    suppressHydrationWarning
                    name="tlOrg"
                    defaultValue={entry.org}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Period" hint={year ? "" : "needs a year"}>
                  <input
                    suppressHydrationWarning
                    name="tlPeriod"
                    value={period}
                    onChange={(e) =>
                      setPeriods((list) => list.map((p, i) => (i === index ? e.target.value : p)))
                    }
                    placeholder="May 2026 — Present"
                    className={cn(inputClass, !year && "border-amber-500/50")}
                  />
                </Field>

                <Field label="Location">
                  <input
                    suppressHydrationWarning
                    name="tlLocation"
                    defaultValue={entry.location ?? ""}
                    placeholder="Optional"
                    className={inputClass}
                  />
                </Field>

                <Field label="Track">
                  <select
                    suppressHydrationWarning
                    name="tlTrack"
                    defaultValue={entry.track}
                    className={inputClass}
                  >
                    {TIMELINE_TRACKS.map((t) => (
                      <option key={t} value={t} className="bg-panel-2">
                        {TRACK_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Kind" hint="Sets the icon">
                  <select
                    suppressHydrationWarning
                    name="tlKind"
                    defaultValue={entry.kind}
                    className={inputClass}
                  >
                    {TIMELINE_KINDS.map((k) => (
                      <option key={k} value={k} className="bg-panel-2">
                        {KIND_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Summary" hint="One line, shown before the card is opened">
                <textarea
                  suppressHydrationWarning
                  name="tlSummary"
                  rows={2}
                  defaultValue={entry.summary}
                  className={cn(inputClass, "resize-y")}
                />
              </Field>

              <Field label="Highlights" hint="One per line — shown when the card opens">
                <textarea
                  suppressHydrationWarning
                  name="tlHighlights"
                  rows={5}
                  defaultValue={entry.highlights.join("\n")}
                  className={cn(inputClass, "resize-y leading-relaxed")}
                />
              </Field>

              <Field label="Stack" hint="Comma separated, shown as chips">
                <input
                  suppressHydrationWarning
                  name="tlStack"
                  defaultValue={entry.stack.join(", ")}
                  className={cn(inputClass, "font-mono text-[12px]")}
                />
              </Field>
            </div>
          </section>
        );
      })}

      {/* Actions */}
      {/* Pinned only from lg. On a phone or tablet a 140px bar 16px off the
          bottom sits exactly where the on-screen keyboard puts the field you
          are typing into. */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/12 bg-panel/95 p-5 backdrop-blur-md sm:p-6 lg:sticky lg:bottom-4">
        <button
          type="submit"
          disabled={pending}
          className="ember-fill inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-[var(--brand-ink)] hover:ember-fill-hot disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save timeline
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setResult(null);
            startTransition(async () => {
              const outcome = await resetTimeline();
              setResult(outcome);
              if (outcome.ok) {
                setEntries(initial);
                setPeriods(initial.map((e) => e.period));
                setVersion((v) => v + 1);
                router.refresh();
              }
            });
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3.5 py-2 text-[12px] font-medium text-zinc-400 transition-colors hover:border-white/30 hover:text-white disabled:opacity-60"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to repo timeline
        </button>

        {result ? (
          <p
            role="status"
            className={cn(
              "flex items-start gap-2 text-[12.5px] leading-relaxed",
              result.ok ? "text-emerald-300" : "text-red-300"
            )}
          >
            {result.ok ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            {result.ok ? result.message : result.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
