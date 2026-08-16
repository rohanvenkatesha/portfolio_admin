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
import { resetLists, saveLists, type ActionResult } from "@/lib/actions/lists";
import {
  SKILL_ACCENTS,
  SKILL_DOMAINS,
  skillsToText,
  type Capability,
  type Lists,
  type Principle,
  type SkillGroup,
  type Stat,
} from "@/content/lists";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-panel-2 px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20";

function Section({
  title,
  note,
  onAdd,
  addLabel,
  children,
}: {
  title: string;
  note: string;
  onAdd: () => void;
  addLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/8 bg-panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">{note}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/12 px-3.5 py-2 text-[12px] font-medium text-zinc-400 transition-colors hover:border-white/30 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          {addLabel}
        </button>
      </div>
      <div className="mt-5 space-y-3">{children}</div>
    </section>
  );
}

function RowControls({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  const button =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 text-zinc-500 transition-colors disabled:opacity-30";

  return (
    <div className="flex shrink-0 gap-1.5">
      <button
        type="button"
        aria-label="Move up"
        disabled={index === 0}
        onClick={() => onMove(-1)}
        className={cn(button, "hover:border-white/30 hover:text-white")}
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label="Move down"
        disabled={index === count - 1}
        onClick={() => onMove(1)}
        className={cn(button, "hover:border-white/30 hover:text-white")}
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label="Remove"
        onClick={onRemove}
        className={cn(button, "hover:border-red-500/50 hover:text-red-400")}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function move<T>(list: T[], from: number, delta: number): T[] {
  const to = from + delta;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/**
 * The four repeating lists behind the Services and About sections.
 *
 * Each list submits as parallel arrays of same-named inputs, which is what a
 * plain form produces and what the action expects — so DOM order is the stored
 * order and moving a row in state is all reordering takes.
 */
export function ListsEditor({ initial }: { initial: Lists }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  const [capabilities, setCapabilities] = useState<Capability[]>(initial.capabilities);
  const [stats, setStats] = useState<Stat[]>(initial.stats);
  const [philosophy, setPhilosophy] = useState<Principle[]>(initial.philosophy);
  const [groups, setGroups] = useState<SkillGroup[]>(initial.skillGroups);
  /** Bumped after a reset so every uncontrolled input re-reads its default. */
  const [version, setVersion] = useState(0);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setResult(null);
    startTransition(async () => {
      const outcome = await saveLists(formData);
      setResult(outcome);
      if (outcome.ok) router.refresh();
    });
  }

  return (
    <form key={version} onSubmit={onSubmit} className="space-y-5">
      {/* ---------------- Services ---------------- */}
      <Section
        title="Services"
        note="The three cards under the hero. Leave the number blank and it's assigned in order."
        addLabel="Add card"
        onAdd={() =>
          setCapabilities((c) => [...c, { number: "", title: "", body: "", tags: [] }])
        }
      >
        {capabilities.map((item, index) => (
          <div key={index} className="rounded-xl border border-white/8 bg-panel-2 p-4">
            <div className="flex items-start gap-3">
              <input
                suppressHydrationWarning
                name="capNumber"
                defaultValue={item.number}
                placeholder="01"
                className={cn(inputClass, "w-16 shrink-0 text-center font-mono")}
              />
              <input
                suppressHydrationWarning
                name="capTitle"
                defaultValue={item.title}
                placeholder="Title"
                className={inputClass}
              />
              <RowControls
                index={index}
                count={capabilities.length}
                onMove={(d) => setCapabilities((c) => move(c, index, d))}
                onRemove={() => setCapabilities((c) => c.filter((_, i) => i !== index))}
              />
            </div>

            <textarea
              suppressHydrationWarning
              name="capBody"
              rows={3}
              defaultValue={item.body}
              placeholder="What this covers"
              className={cn(inputClass, "mt-2.5 resize-y leading-relaxed")}
            />
            <input
              suppressHydrationWarning
              name="capTags"
              defaultValue={item.tags.join(", ")}
              placeholder="Tags, comma separated"
              className={cn(inputClass, "mt-2.5 font-mono text-[12px]")}
            />
          </div>
        ))}
      </Section>

      {/* ---------------- Stats ---------------- */}
      <Section
        title="Numbers"
        note="The counters on the warm panel. Each animates up to its value, so it has to be a number — put any + or % in the suffix."
        addLabel="Add number"
        onAdd={() => setStats((s) => [...s, { value: 0, suffix: "", label: "" }])}
      >
        {stats.map((stat, index) => (
          <div
            key={index}
            className="grid gap-2 rounded-xl border border-white/8 bg-panel-2 p-3 sm:grid-cols-[6rem_5rem_1fr_auto]"
          >
            <input
              suppressHydrationWarning
              name="statValue"
              type="number"
              step="any"
              defaultValue={stat.value}
              placeholder="7"
              className={cn(inputClass, "font-mono")}
            />
            <input
              suppressHydrationWarning
              name="statSuffix"
              defaultValue={stat.suffix}
              placeholder="+"
              className={cn(inputClass, "text-center font-mono")}
            />
            <input
              suppressHydrationWarning
              name="statLabel"
              defaultValue={stat.label}
              placeholder="Years building software"
              className={inputClass}
            />
            <RowControls
              index={index}
              count={stats.length}
              onMove={(d) => setStats((s) => move(s, index, d))}
              onRemove={() => setStats((s) => s.filter((_, i) => i !== index))}
            />
          </div>
        ))}
      </Section>

      {/* ---------------- Principles ---------------- */}
      <Section
        title="Principles"
        note="The numbered cards beside your bio in About. Numbering follows the order here."
        addLabel="Add principle"
        onAdd={() => setPhilosophy((p) => [...p, { title: "", body: "" }])}
      >
        {philosophy.map((item, index) => (
          <div key={index} className="rounded-xl border border-white/8 bg-panel-2 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-2.5 shrink-0 font-mono text-[11px] text-zinc-600">
                {String(index + 1).padStart(2, "0")}
              </span>
              <input
                suppressHydrationWarning
                name="prTitle"
                defaultValue={item.title}
                placeholder="Title"
                className={inputClass}
              />
              <RowControls
                index={index}
                count={philosophy.length}
                onMove={(d) => setPhilosophy((p) => move(p, index, d))}
                onRemove={() => setPhilosophy((p) => p.filter((_, i) => i !== index))}
              />
            </div>
            <textarea
              suppressHydrationWarning
              name="prBody"
              rows={3}
              defaultValue={item.body}
              placeholder="The thinking behind it"
              className={cn(inputClass, "mt-2.5 resize-y leading-relaxed")}
            />
          </div>
        ))}
      </Section>

      {/* ---------------- Skills ---------------- */}
      <Section
        title="Skills"
        note="The matrix at the bottom of About. Skills are one per line as “name | level”, level 0–100."
        addLabel="Add group"
        onAdd={() =>
          setGroups((g) => [
            ...g,
            { id: `s-${Date.now().toString(36)}`, label: "", domain: "engineering", accent: "cyan", skills: [] },
          ])
        }
      >
        {groups.map((group, index) => (
          <div key={group.id} className="rounded-xl border border-white/8 bg-panel-2 p-4">
            <input type="hidden" name="sgId" value={group.id} />

            <div className="grid gap-2 sm:grid-cols-[1fr_9rem_8rem_auto]">
              <input
                suppressHydrationWarning
                name="sgLabel"
                defaultValue={group.label}
                placeholder="Group name"
                className={inputClass}
              />
              <select
                suppressHydrationWarning
                name="sgDomain"
                defaultValue={group.domain}
                className={inputClass}
              >
                {SKILL_DOMAINS.map((d) => (
                  <option key={d} value={d} className="bg-panel-2">
                    {d}
                  </option>
                ))}
              </select>
              <select
                suppressHydrationWarning
                name="sgAccent"
                defaultValue={group.accent}
                className={inputClass}
              >
                {SKILL_ACCENTS.map((a) => (
                  <option key={a} value={a} className="bg-panel-2">
                    {a}
                  </option>
                ))}
              </select>
              <RowControls
                index={index}
                count={groups.length}
                onMove={(d) => setGroups((g) => move(g, index, d))}
                onRemove={() => setGroups((g) => g.filter((_, i) => i !== index))}
              />
            </div>

            <textarea
              suppressHydrationWarning
              name="sgSkills"
              rows={5}
              defaultValue={skillsToText(group.skills)}
              placeholder={"Python | 95\nTypeScript | 88"}
              className={cn(inputClass, "mt-2.5 resize-y font-mono text-[13px]")}
            />
          </div>
        ))}

        <p className="text-[11px] text-zinc-600">
          The domain decides which filter a group appears under — Everything, Engineering or
          Creative.
        </p>
      </Section>

      {/* ---------------- Actions ---------------- */}
      <div className="sticky bottom-4 flex flex-wrap items-center gap-4 rounded-2xl border border-white/12 bg-panel/95 p-6 backdrop-blur-md">
        <button
          type="submit"
          disabled={pending}
          className="ember-fill inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-[var(--brand-ink)] hover:ember-fill-hot disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setResult(null);
            startTransition(async () => {
              const outcome = await resetLists();
              setResult(outcome);
              if (outcome.ok) {
                setCapabilities(initial.capabilities);
                setStats(initial.stats);
                setPhilosophy(initial.philosophy);
                setGroups(initial.skillGroups);
                setVersion((v) => v + 1);
                router.refresh();
              }
            });
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3.5 py-2 text-[12px] font-medium text-zinc-400 transition-colors hover:border-white/30 hover:text-white disabled:opacity-60"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to repo content
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
