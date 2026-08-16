"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { resetProfile, saveProfile, type ActionResult } from "@/lib/actions/profile";
import { SOCIAL_ICONS, type Profile, type Social, type SocialIcon } from "@/content/profile";
import { ImagePicker } from "@/components/admin/image-picker";
import type { MediaFile } from "@/lib/content/media";
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

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/8 bg-panel p-6">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

/**
 * Everything identifying you: the masthead, the bio, how to reach you, and the
 * links. Blank fields fall back to the values in the repo rather than saving
 * empty, so clearing one by accident can't blank that spot on the site.
 */
export function ProfileForm({ initial, portraits }: { initial: Profile; portraits: MediaFile[] }) {
  const router = useRouter();
  const formId = useId();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  /** Socials are the one part with add/remove, so they need local state. */
  const [socials, setSocials] = useState<Social[]>(initial.socials);
  /** Bumped after a reset so every uncontrolled input re-reads its default. */
  const [version, setVersion] = useState(0);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setResult(null);
    startTransition(async () => {
      const outcome = await saveProfile(formData);
      setResult(outcome);
      if (outcome.ok) router.refresh();
    });
  }

  return (
    <form key={version} id={formId} onSubmit={onSubmit} className="space-y-5">
      <Group title="Identity">
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <Field label="Name" hint="Masthead, nav and metadata">
            <input
              suppressHydrationWarning
              name="name"
              defaultValue={initial.name}
              className={inputClass}
            />
          </Field>
          <Field label="Initials" hint="Nav mark, max 3">
            <input
              suppressHydrationWarning
              name="initials"
              maxLength={3}
              defaultValue={initial.initials}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Rotating roles" hint="One per line — cycles under the hero">
          <textarea
            suppressHydrationWarning
            name="roles"
            rows={5}
            defaultValue={initial.roles.join("\n")}
            className={cn(inputClass, "resize-y font-mono text-[13px]")}
          />
        </Field>

        <Field label="Tagline" hint="Shown in the footer">
          <input
            suppressHydrationWarning
            name="tagline"
            defaultValue={initial.tagline}
            className={inputClass}
          />
        </Field>
      </Group>

      <Group title="Bio">
        <Field label="Short bio" hint="One or two sentences, under the hero">
          <textarea
            suppressHydrationWarning
            name="bioShort"
            rows={3}
            defaultValue={initial.bioShort}
            className={cn(inputClass, "resize-y")}
          />
        </Field>

        <Field label="Long bio" hint="About panel — leave a blank line between paragraphs">
          <textarea
            suppressHydrationWarning
            name="bio"
            rows={10}
            defaultValue={initial.bio}
            className={cn(inputClass, "resize-y leading-relaxed")}
          />
        </Field>
      </Group>

      <Group title="Contact & availability">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email">
            <input
              suppressHydrationWarning
              name="email"
              type="email"
              defaultValue={initial.email}
              className={inputClass}
            />
          </Field>
          <Field label="Location">
            <input
              suppressHydrationWarning
              name="location"
              defaultValue={initial.location}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Time zone" hint="IANA — drives the footer clock">
            <input
              suppressHydrationWarning
              name="timezone"
              defaultValue={initial.timezone}
              placeholder="America/Detroit"
              className={cn(inputClass, "font-mono text-[13px]")}
            />
          </Field>
          <Field label="Résumé link" hint="A /path downloads, a URL opens in a tab">
            <input
              suppressHydrationWarning
              name="resumeUrl"
              defaultValue={initial.resumeUrl}
              className={cn(inputClass, "font-mono text-[12px]")}
            />
          </Field>
        </div>

        <Field label="Availability" hint="The status pill on the hero">
          <input
            suppressHydrationWarning
            name="availability"
            defaultValue={initial.availability}
            className={inputClass}
          />
        </Field>
      </Group>

      <Group title="Portrait">
        <ImagePicker
          name="portraitUrl"
          folder="portrait"
          files={portraits}
          initialSrc={initial.portraitUrl}
          label="Hero portrait"
          hint="Committed under public/media/portrait — 4:5 crops fit exactly"
        />
        <p className="text-[11px] leading-relaxed text-zinc-600">
          Leave this empty and the frame shows an initials plate instead. The photo renders as an
          ember duotone that resolves to colour on hover, so pick a shot with real separation
          between lights and darks.
        </p>
      </Group>

      <Group title="Tech strip">
        <Field label="Marquee items" hint="One per line — scrolls under the hero">
          <textarea
            suppressHydrationWarning
            name="marquee"
            rows={7}
            defaultValue={initial.marquee.join("\n")}
            className={cn(inputClass, "resize-y font-mono text-[13px]")}
          />
        </Field>
      </Group>

      {/* Socials — the only repeating list here, so it gets add/remove */}
      <section className="rounded-2xl border border-white/8 bg-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Social links</h2>
          <button
            type="button"
            onClick={() => setSocials((rows) => [...rows, { label: "", href: "", icon: "mail" }])}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3.5 py-2 text-[12px] font-medium text-zinc-400 transition-colors hover:border-white/30 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Add link
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {socials.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 bg-panel-2 px-4 py-6 text-center text-[12px] text-zinc-600">
              No links. The social pills will be hidden.
            </p>
          ) : null}

          {socials.map((social, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-xl border border-white/8 bg-panel-2 p-3 sm:grid-cols-[1fr_2fr_auto_auto]"
            >
              <input
                suppressHydrationWarning
                name="socialLabel"
                defaultValue={social.label}
                placeholder="Label"
                className={inputClass}
              />
              <input
                suppressHydrationWarning
                name="socialHref"
                defaultValue={social.href}
                placeholder="https://… or mailto:…"
                className={cn(inputClass, "font-mono text-[12px]")}
              />
              <select
                suppressHydrationWarning
                name="socialIcon"
                defaultValue={social.icon}
                className={inputClass}
              >
                {SOCIAL_ICONS.map((icon) => (
                  <option key={icon} value={icon} className="bg-panel-2">
                    {icon}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSocials((rows) => rows.filter((_, i) => i !== index))}
                aria-label={`Remove ${social.label || "link"}`}
                className="inline-flex items-center justify-center rounded-xl border border-white/12 px-3 text-zinc-500 transition-colors hover:border-red-500/50 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[11px] text-zinc-600">
          Rows missing a label or a link are dropped on save. The icon list is fixed — those are the
          only marks that exist.
        </p>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/8 bg-panel p-6">
        <button
          type="submit"
          disabled={pending}
          className="ember-fill inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-[var(--brand-ink)] hover:ember-fill-hot disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save profile
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setResult(null);
            startTransition(async () => {
              const outcome = await resetProfile();
              setResult(outcome);
              if (outcome.ok) {
                setSocials([]);
                setVersion((v) => v + 1);
                router.refresh();
              }
            });
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3.5 py-2 text-[12px] font-medium text-zinc-400 transition-colors hover:border-white/30 hover:text-white disabled:opacity-60"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to repo values
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

/** Re-exported so the page can name the type without reaching into content/. */
export type { SocialIcon };
