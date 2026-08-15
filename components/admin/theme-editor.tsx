"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Palette, RotateCcw, Save } from "lucide-react";
import { resetTheme, saveTheme, type ActionResult } from "@/lib/actions/theme";
import { DEFAULT_THEME, THEME_PRESETS, isValidHex, type Theme } from "@/content/theme";
import { cn } from "@/lib/utils";

const FIELDS: { key: keyof Theme; label: string; hint: string }[] = [
  { key: "accent", label: "Accent", hint: "Drives every highlight, button and glow" },
  { key: "void", label: "Page", hint: "The darkest surface, behind everything" },
  { key: "panel", label: "Panel", hint: "Section backgrounds" },
  { key: "panel2", label: "Card", hint: "Cards nested inside a panel" },
];

export function ThemeEditor({ initial }: { initial: Theme }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [theme, setTheme] = useState<Theme>(initial);
  const [result, setResult] = useState<ActionResult | null>(null);

  /**
   * Paint the pending theme onto the live document so the admin shell itself
   * previews it. Cheaper and more honest than a mock swatch panel — you're
   * looking at real components in the real colours.
   */
  useEffect(() => {
    const root = document.documentElement;
    const applied: [string, string][] = [
      ["--brand", theme.accent],
      ["--color-void", theme.void],
      ["--color-panel", theme.panel],
      ["--color-panel-2", theme.panel2],
    ];

    for (const [prop, value] of applied) {
      if (isValidHex(value)) root.style.setProperty(prop, value);
    }

    return () => {
      // Hand control back to the server-rendered <style> on unmount
      for (const [prop] of applied) root.style.removeProperty(prop);
    };
  }, [theme]);

  const dirty = FIELDS.some((f) => theme[f.key] !== initial[f.key]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setResult(null);
    startTransition(async () => {
      const outcome = await saveTheme(formData);
      setResult(outcome);
      if (outcome.ok) router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/8 bg-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Palette className="h-4 w-4 text-brand-500" />
            Theme
          </h2>
          <p className="mt-1 text-[11px] text-zinc-600">
            Changes preview live on this page. Save to apply them to the site.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setTheme(DEFAULT_THEME);
            setResult(null);
            startTransition(async () => {
              const outcome = await resetTheme();
              setResult(outcome);
              if (outcome.ok) router.refresh();
            });
          }}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3.5 py-2 text-[12px] font-medium text-zinc-400 transition-colors hover:border-white/30 hover:text-white disabled:opacity-60"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      {/* Presets */}
      <div className="mt-6">
        <p className="eyebrow mb-3 text-zinc-600">Presets</p>
        <div className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((preset) => {
            const active = FIELDS.every((f) => theme[f.key] === preset.theme[f.key]);
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => setTheme(preset.theme)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                  active
                    ? "border-white/40 text-white"
                    : "border-white/10 text-zinc-400 hover:border-white/25 hover:text-white"
                )}
              >
                <span
                  className="h-3 w-3 rounded-full ring-1 ring-white/20"
                  style={{ backgroundColor: preset.theme.accent }}
                />
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Colours */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {FIELDS.map(({ key, label, hint }) => (
          <div key={key} className="rounded-xl border border-white/8 bg-panel-2 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[12px] font-medium text-zinc-300">{label}</span>
              <span className="text-[10px] text-zinc-600">{hint}</span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              {/* Native picker for choosing, text field for pasting an exact value */}
              <input
                suppressHydrationWarning
                type="color"
                aria-label={`${label} colour picker`}
                value={theme[key]}
                onChange={(e) => setTheme((t) => ({ ...t, [key]: e.target.value }))}
                className="h-10 w-14 cursor-pointer rounded-lg border border-white/12 bg-transparent p-1"
              />
              <input
                suppressHydrationWarning
                name={key}
                value={theme[key]}
                onChange={(e) => setTheme((t) => ({ ...t, [key]: e.target.value }))}
                spellCheck={false}
                className={cn(
                  "w-full rounded-lg border bg-panel px-3 py-2 font-mono text-[13px] text-white outline-none transition-colors",
                  isValidHex(theme[key])
                    ? "border-white/10 focus:border-brand-500/60"
                    : "border-red-500/50"
                )}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending || !dirty}
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-[13px] font-semibold text-[var(--brand-ink)] transition-colors hover:bg-brand-400 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {dirty ? "Save theme" : "No changes"}
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
