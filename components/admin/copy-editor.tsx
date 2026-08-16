"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, RotateCcw, Save } from "lucide-react";
import { resetCopy, saveCopy, type ActionResult } from "@/lib/actions/copy";
import { COPY_IDS, COPY_LABELS, type Copy, type CopyId } from "@/content/copy";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-panel-2 px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20";

/**
 * Every section's eyebrow, two-line headline and description.
 *
 * The headline is split because the components render it as two lines with the
 * second one accented — see content/copy.ts. The preview line shows how the two
 * halves read together so the split doesn't have to be imagined.
 */
export function CopyEditor({ initial }: { initial: Copy }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [draft, setDraft] = useState<Copy>(initial);
  /** Bumped after a reset so the uncontrolled inputs re-read their defaults. */
  const [version, setVersion] = useState(0);

  function update(id: CopyId, field: keyof Copy[CopyId], value: string) {
    setDraft((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setResult(null);
    startTransition(async () => {
      const outcome = await saveCopy(formData);
      setResult(outcome);
      if (outcome.ok) router.refresh();
    });
  }

  return (
    <form key={version} onSubmit={onSubmit} className="space-y-5">
      {COPY_IDS.map((id) => {
        const entry = draft[id];
        const meta = COPY_LABELS[id];

        return (
          <section key={id} className="rounded-2xl border border-white/8 bg-panel p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">{meta.title}</h2>
              <span className="font-mono text-[11px] text-zinc-600">{meta.note}</span>
            </div>

            {/* How the two halves actually read on the page */}
            <p className="mt-4 rounded-xl border border-white/8 bg-panel-2 px-4 py-3 text-[15px] font-semibold leading-snug text-white">
              {entry.titleLead}{" "}
              <span className="text-brand-500">{entry.titleAccent}</span>
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr]">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                  Small label
                </span>
                <input
                  suppressHydrationWarning
                  name={`${id}.eyebrow`}
                  defaultValue={entry.eyebrow}
                  onChange={(e) => update(id, "eyebrow", e.target.value)}
                  placeholder="(none)"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                  Headline — first line
                </span>
                <input
                  suppressHydrationWarning
                  name={`${id}.titleLead`}
                  defaultValue={entry.titleLead}
                  onChange={(e) => update(id, "titleLead", e.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                  Headline — second line
                </span>
                <input
                  suppressHydrationWarning
                  name={`${id}.titleAccent`}
                  defaultValue={entry.titleAccent}
                  onChange={(e) => update(id, "titleAccent", e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <label className="mt-3 block">
              <span className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-[11px] font-medium text-zinc-400">Description</span>
                {meta.note.includes("{count}") ? (
                  <span className="font-mono text-[10px] text-brand-400">
                    {"{count}"} = live total
                  </span>
                ) : null}
              </span>
              <textarea
                suppressHydrationWarning
                name={`${id}.description`}
                rows={3}
                defaultValue={entry.description}
                onChange={(e) => update(id, "description", e.target.value)}
                className={cn(inputClass, "resize-y leading-relaxed")}
              />
            </label>
          </section>
        );
      })}

      {/* Actions */}
      <div className="sticky bottom-4 flex flex-wrap items-center gap-4 rounded-2xl border border-white/12 bg-panel/95 p-6 backdrop-blur-md">
        <button
          type="submit"
          disabled={pending}
          className="ember-fill inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-[var(--brand-ink)] hover:ember-fill-hot disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save headings
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setResult(null);
            startTransition(async () => {
              const outcome = await resetCopy();
              setResult(outcome);
              if (outcome.ok) {
                setDraft(initial);
                setVersion((v) => v + 1);
                router.refresh();
              }
            });
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3.5 py-2 text-[12px] font-medium text-zinc-400 transition-colors hover:border-white/30 hover:text-white disabled:opacity-60"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to the original wording
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
