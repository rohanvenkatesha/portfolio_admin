"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronDown, ChevronUp, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  moveSection,
  toggleSection,
  toggleSectionNav,
  type ActionResult,
} from "@/lib/actions/sections";
import type { SectionConfig } from "@/content/sections";
import { cn } from "@/lib/utils";

export function SectionManager({ sections }: { sections: SectionConfig[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const ordered = [...sections].sort((a, b) => a.order - b.order);
  const liveCount = ordered.filter((s) => s.enabled).length;

  function run(action: () => Promise<ActionResult>, id: string) {
    setBusyId(id);
    setResult(null);
    startTransition(async () => {
      const outcome = await action();
      setResult(outcome);
      setBusyId(null);
      if (outcome.ok) router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-panel">
      <div className="flex items-center justify-between gap-4 border-b border-white/8 px-6 py-5">
        <div>
          <h2 className="text-sm font-semibold text-white">Sections</h2>
          <p className="mt-0.5 text-[11px] text-zinc-600">
            Hiding a section removes it from the page, nav, footer and ⌘K palette.
          </p>
        </div>
        <span className="shrink-0 font-mono text-[11px] text-zinc-600">
          {liveCount}/{ordered.length} live
        </span>
      </div>

      {result ? (
        <p
          role="status"
          className={cn(
            "flex items-start gap-2 border-b border-white/8 px-6 py-3 text-[12.5px]",
            result.ok ? "text-emerald-300" : "text-red-300"
          )}
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {result.ok ? result.message : result.error}
        </p>
      ) : null}

      <ul>
        {ordered.map((section, index) => {
          const busy = busyId === section.id;

          return (
            <li
              key={section.id}
              className={cn(
                "flex items-center gap-3 border-b border-white/6 px-6 py-4 last:border-0 transition-opacity",
                !section.enabled && "opacity-50"
              )}
            >
              {/* Reorder */}
              <div className="flex flex-col">
                <button
                  onClick={() => run(() => moveSection(section.id, "up"), section.id)}
                  disabled={pending || index === 0}
                  aria-label={`Move ${section.label} earlier`}
                  className="text-zinc-600 transition-colors hover:text-white disabled:opacity-25"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => run(() => moveSection(section.id, "down"), section.id)}
                  disabled={pending || index === ordered.length - 1}
                  aria-label={`Move ${section.label} later`}
                  className="text-zinc-600 transition-colors hover:text-white disabled:opacity-25"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{section.label}</p>
                <p className="truncate text-[11px] text-zinc-600">
                  {section.note ?? `#${section.id}`}
                </p>
              </div>

              {/* In nav */}
              <button
                onClick={() => run(() => toggleSectionNav(section.id), section.id)}
                disabled={pending || !section.enabled}
                title={section.inNav ? "Shown in nav" : "Hidden from nav"}
                aria-pressed={section.inNav}
                className={cn(
                  "hidden rounded-full border px-2.5 py-1 font-mono text-[10px] transition-colors disabled:opacity-30 sm:block",
                  section.inNav
                    ? "border-white/25 text-zinc-300"
                    : "border-white/10 text-zinc-600"
                )}
              >
                nav
              </button>

              {/* Visibility */}
              <button
                onClick={() => run(() => toggleSection(section.id), section.id)}
                disabled={pending}
                aria-pressed={section.enabled}
                title={section.enabled ? "Live — click to hide" : "Hidden — click to show"}
                className={cn(
                  "inline-flex min-w-[5.5rem] items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-60",
                  section.enabled
                    ? "border-orange-500/40 bg-orange-500/10 text-orange-300"
                    : "border-white/10 bg-white/5 text-zinc-500"
                )}
              >
                {busy ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : section.enabled ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
                {section.enabled ? "Live" : "Hidden"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
