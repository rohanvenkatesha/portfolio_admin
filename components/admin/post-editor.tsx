"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { savePost, type ActionResult } from "@/lib/actions/posts";
import { BLOCK_TYPES, type BlockType, type PostBlock, type Rider, type TripPost, type Waypoint } from "@/content/posts";
import { SOCIAL_ICONS } from "@/content/profile";
import type { MediaFile } from "@/lib/content/media";
import type { Trip } from "@/content/site";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-panel-2 px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20";

/** What each block type calls its main field, and whether it has a caption. */
const BLOCK_META: Record<BlockType, { label: string; body: string; caption?: string; textarea?: boolean }> = {
  text: { label: "Paragraph", body: "Text — blank lines separate paragraphs", textarea: true },
  heading: { label: "Heading", body: "Heading" },
  image: { label: "Image", body: "Image", caption: "Caption (optional)" },
  // Renders nothing where it sits — it's the bulk way to push frames into the
  // gallery section. The label has to say so or it looks broken after saving.
  gallery: { label: "Add to gallery", body: "Images", caption: "" },
  quote: { label: "Pull quote", body: "Quote", caption: "Attribution (optional)", textarea: true },
  video: { label: "Video", body: "YouTube URL", caption: "Caption (optional)" },
};

/** Editor rows carry both fields regardless of type; the action ignores what doesn't apply. */
type BlockRow = { type: BlockType; body: string; caption: string };

function toRows(blocks: PostBlock[]): BlockRow[] {
  return blocks.map((block): BlockRow => {
    switch (block.type) {
      case "text":
        return { type: "text", body: block.body, caption: "" };
      case "heading":
        return { type: "heading", body: block.text, caption: "" };
      case "image":
        return { type: "image", body: block.src, caption: block.caption ?? "" };
      case "gallery":
        return { type: "gallery", body: block.images.map((i) => i.src).join("\n"), caption: "" };
      case "quote":
        return { type: "quote", body: block.text, caption: block.attribution ?? "" };
      case "video":
        return { type: "video", body: block.url, caption: block.caption ?? "" };
    }
  });
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/8 bg-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3.5 py-2 text-[12px] font-medium text-zinc-400 transition-colors hover:border-white/30 hover:text-white"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function IconButton({
  onClick,
  label,
  danger,
  disabled,
  children,
}: {
  onClick: () => void;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 text-zinc-500 transition-colors disabled:opacity-30",
        danger ? "hover:border-red-500/50 hover:text-red-400" : "hover:border-white/30 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

/** Compact media grid. Single-select for an image, multi for a gallery. */
function MediaGrid({
  files,
  value,
  onChange,
  multiple,
}: {
  files: MediaFile[];
  value: string;
  onChange: (next: string) => void;
  multiple?: boolean;
}) {
  const selected = multiple ? value.split("\n").map((s) => s.trim()).filter(Boolean) : [value];

  if (files.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/15 bg-panel-2 px-4 py-6 text-center text-[11px] leading-relaxed text-zinc-600">
        Nothing in <code className="font-mono text-zinc-500">public/media/trips</code> yet. Drop
        images there and commit them.
      </p>
    );
  }

  return (
    <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto rounded-xl border border-white/10 bg-panel-2 p-2 sm:grid-cols-6">
      {files.map((file) => {
        const on = selected.includes(file.src);
        return (
          <button
            key={file.src}
            type="button"
            title={file.name}
            aria-pressed={on}
            onClick={() => {
              if (!multiple) {
                onChange(on ? "" : file.src);
                return;
              }
              // Toggling keeps click order, so a gallery is arranged by the
              // order you pick rather than by folder order.
              const next = on ? selected.filter((s) => s !== file.src) : [...selected, file.src];
              onChange(next.join("\n"));
            }}
            className={cn(
              "relative aspect-square overflow-hidden rounded-lg border transition-all",
              on ? "border-brand-500 ring-2 ring-brand-500/30" : "border-white/10 hover:border-white/30"
            )}
          >
            <Image src={file.src} alt={file.name} fill sizes="90px" className="object-cover" />
            {on && multiple ? (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 font-mono text-[9px] font-bold text-white">
                {selected.indexOf(file.src) + 1}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The post editor.
 *
 * Repeating groups — blocks, waypoints, riders, stats — submit as parallel
 * arrays of same-named inputs, which is what a plain form produces and what the
 * action expects. DOM order is the stored order, so reordering a row in state
 * is all that's needed to reorder the saved data.
 */
export function PostEditor({
  post,
  trip,
  trips,
  media,
}: {
  post: TripPost;
  trip: Trip;
  trips: Trip[];
  media: MediaFile[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  const [blocks, setBlocks] = useState<BlockRow[]>(toRows(post.blocks));
  const [route, setRoute] = useState<Waypoint[]>(post.route);
  const [riders, setRiders] = useState<Rider[]>(post.riders);
  const [stats, setStats] = useState(post.stats);
  const [related, setRelated] = useState<string[]>(post.relatedTripIds);
  const [published, setPublished] = useState(post.published);
  const [cover, setCover] = useState(post.coverUrl ?? "");

  function move<T>(list: T[], from: number, delta: number): T[] {
    const to = from + delta;
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    [next[from], next[to]] = [next[to], next[from]];
    return next;
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setResult(null);
    startTransition(async () => {
      const outcome = await savePost(formData);
      setResult(outcome);
      if (outcome.ok) router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="id" value={post.id} />
      <input type="hidden" name="order" value={post.order} />

      {/* ---------------- Basics ---------------- */}
      <Section title="Basics">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-zinc-300">Title</span>
              <input suppressHydrationWarning name="title" defaultValue={post.title} className={inputClass} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-zinc-300">Date</span>
              <input suppressHydrationWarning name="date" type="date" defaultValue={post.date} className={inputClass} />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-[12px] font-medium text-zinc-300">URL slug</span>
              <span className="font-mono text-[10px] text-zinc-600">
                /travel/{trip.slug}/{post.slug}
              </span>
            </span>
            <input suppressHydrationWarning name="slug" defaultValue={post.slug} className={cn(inputClass, "font-mono text-[13px]")} />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-[12px] font-medium text-zinc-300">Excerpt</span>
              <span className="text-[11px] text-zinc-600">Listing card and meta description</span>
            </span>
            <textarea suppressHydrationWarning name="excerpt" rows={2} defaultValue={post.excerpt} className={cn(inputClass, "resize-y")} />
          </label>
        </div>
      </Section>

      {/* ---------------- Cover ---------------- */}
      <Section title="Cover photo">
        <input type="hidden" name="coverUrl" value={cover} />
        <MediaGrid files={media} value={cover} onChange={setCover} />
        {cover ? (
          <p className="mt-2 font-mono text-[11px] text-zinc-500">{cover}</p>
        ) : (
          <p className="mt-2 text-[11px] text-zinc-600">No cover — the listing card shows text only.</p>
        )}
      </Section>

      {/* ---------------- Body ---------------- */}
      <Section
        title="Body"
        action={
          <div className="flex flex-wrap gap-1.5">
            {BLOCK_TYPES.map((type) => (
              <AddButton
                key={type}
                label={BLOCK_META[type].label}
                onClick={() => setBlocks((b) => [...b, { type, body: "", caption: "" }])}
              />
            ))}
          </div>
        }
      >
        {blocks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 bg-panel-2 px-4 py-8 text-center text-[12px] text-zinc-600">
            No blocks yet. Add a paragraph, image, gallery, quote or video above.
          </p>
        ) : (
          <div className="space-y-3">
            {blocks.map((block, index) => {
              const meta = BLOCK_META[block.type];
              return (
                <div key={index} className="rounded-xl border border-white/8 bg-panel-2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-brand-400">
                      {index + 1}. {meta.label}
                    </span>
                    <div className="flex gap-1.5">
                      <IconButton label="Move up" disabled={index === 0} onClick={() => setBlocks((b) => move(b, index, -1))}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </IconButton>
                      <IconButton label="Move down" disabled={index === blocks.length - 1} onClick={() => setBlocks((b) => move(b, index, 1))}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </IconButton>
                      <IconButton label="Remove block" danger onClick={() => setBlocks((b) => b.filter((_, i) => i !== index))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconButton>
                    </div>
                  </div>

                  <input type="hidden" name="blockType" value={block.type} />

                  <div className="mt-3 space-y-2">
                    {block.type === "image" || block.type === "gallery" ? (
                      <>
                        <input type="hidden" name="blockBody" value={block.body} />
                        {block.type === "gallery" ? (
                          <p className="rounded-lg border border-white/8 bg-panel px-3 py-2 text-[11px] leading-relaxed text-zinc-500">
                            These don&apos;t appear here in the post — they go into the gallery
                            section at the bottom, alongside every other image.
                          </p>
                        ) : null}
                        <MediaGrid
                          files={media}
                          value={block.body}
                          multiple={block.type === "gallery"}
                          onChange={(next) =>
                            setBlocks((b) => b.map((row, i) => (i === index ? { ...row, body: next } : row)))
                          }
                        />
                      </>
                    ) : meta.textarea ? (
                      <textarea
                        suppressHydrationWarning
                        name="blockBody"
                        rows={block.type === "text" ? 6 : 3}
                        placeholder={meta.body}
                        value={block.body}
                        onChange={(e) =>
                          setBlocks((b) => b.map((row, i) => (i === index ? { ...row, body: e.target.value } : row)))
                        }
                        className={cn(inputClass, "resize-y leading-relaxed")}
                      />
                    ) : (
                      <input
                        suppressHydrationWarning
                        name="blockBody"
                        placeholder={meta.body}
                        value={block.body}
                        onChange={(e) =>
                          setBlocks((b) => b.map((row, i) => (i === index ? { ...row, body: e.target.value } : row)))
                        }
                        className={inputClass}
                      />
                    )}

                    {/* Every row submits a caption so the arrays stay aligned,
                        even where the type has no use for one. */}
                    {meta.caption ? (
                      <input
                        suppressHydrationWarning
                        name="blockCaption"
                        placeholder={meta.caption}
                        value={block.caption}
                        onChange={(e) =>
                          setBlocks((b) => b.map((row, i) => (i === index ? { ...row, caption: e.target.value } : row)))
                        }
                        className={inputClass}
                      />
                    ) : (
                      <input type="hidden" name="blockCaption" value="" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ---------------- Route ---------------- */}
      <Section
        title="Route"
        action={<AddButton label="Add stop" onClick={() => setRoute((r) => [...r, { name: "", lat: 0, lng: 0 }])} />}
      >
        {route.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 bg-panel-2 px-4 py-8 text-center text-[12px] text-zinc-600">
            No stops — the map is hidden. Add stops in the order you travelled them.
          </p>
        ) : (
          <div className="space-y-2">
            {route.map((stop, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-white/8 bg-panel-2 p-3 sm:grid-cols-[auto_1.4fr_0.7fr_0.7fr_1.4fr_auto]">
                <span className="ember-fill-hot hidden h-8 w-8 items-center justify-center self-center rounded-full font-mono text-[10px] font-bold text-white sm:flex">
                  {index + 1}
                </span>
                <input suppressHydrationWarning name="wpName" placeholder="Stop name" defaultValue={stop.name} className={inputClass} />
                <input suppressHydrationWarning name="wpLat" type="number" step="any" placeholder="Lat" defaultValue={stop.lat} className={cn(inputClass, "font-mono text-[12px]")} />
                <input suppressHydrationWarning name="wpLng" type="number" step="any" placeholder="Lng" defaultValue={stop.lng} className={cn(inputClass, "font-mono text-[12px]")} />
                <input suppressHydrationWarning name="wpNote" placeholder="Note (optional)" defaultValue={stop.note ?? ""} className={inputClass} />
                <div className="flex gap-1.5 self-center">
                  <IconButton label="Move up" disabled={index === 0} onClick={() => setRoute((r) => move(r, index, -1))}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </IconButton>
                  <IconButton label="Remove stop" danger onClick={() => setRoute((r) => r.filter((_, i) => i !== index))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              </div>
            ))}
            <p className="text-[11px] text-zinc-600">
              Coordinates in decimal degrees. Right-click a spot on Google Maps to copy them.
            </p>
          </div>
        )}
      </Section>

      {/* ---------------- Stats ---------------- */}
      <Section
        title="Stats"
        action={<AddButton label="Add stat" onClick={() => setStats((s) => [...s, { label: "", value: "" }])} />}
      >
        {stats.length === 0 ? (
          <p className="text-[12px] text-zinc-600">None — the stats strip is hidden.</p>
        ) : (
          <div className="space-y-2">
            {stats.map((stat, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-white/8 bg-panel-2 p-3 sm:grid-cols-[1fr_1fr_auto]">
                <input suppressHydrationWarning name="statLabel" placeholder="Label — e.g. Distance" defaultValue={stat.label} className={inputClass} />
                <input suppressHydrationWarning name="statValue" placeholder="Value — e.g. 428 km" defaultValue={stat.value} className={inputClass} />
                <IconButton label="Remove stat" danger onClick={() => setStats((s) => s.filter((_, i) => i !== index))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ---------------- Riders ---------------- */}
      <Section
        title="Rode with"
        action={<AddButton label="Add rider" onClick={() => setRiders((r) => [...r, { name: "", href: "", icon: "instagram" }])} />}
      >
        {riders.length === 0 ? (
          <p className="text-[12px] text-zinc-600">None — the section is hidden.</p>
        ) : (
          <div className="space-y-2">
            {riders.map((rider, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-white/8 bg-panel-2 p-3 sm:grid-cols-[1fr_0.8fr_1.4fr_auto_auto]">
                <input suppressHydrationWarning name="riderName" placeholder="Name" defaultValue={rider.name} className={inputClass} />
                <input suppressHydrationWarning name="riderHandle" placeholder="@handle" defaultValue={rider.handle ?? ""} className={inputClass} />
                <input suppressHydrationWarning name="riderHref" placeholder="https://…" defaultValue={rider.href} className={cn(inputClass, "font-mono text-[12px]")} />
                <select suppressHydrationWarning name="riderIcon" defaultValue={rider.icon} className={inputClass}>
                  {SOCIAL_ICONS.map((icon) => (
                    <option key={icon} value={icon} className="bg-panel-2">
                      {icon}
                    </option>
                  ))}
                </select>
                <IconButton label="Remove rider" danger onClick={() => setRiders((r) => r.filter((_, i) => i !== index))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ---------------- Related trips ---------------- */}
      <Section title="Related journeys">
        {trips.filter((t) => t.id !== trip.id).length === 0 ? (
          <p className="text-[12px] text-zinc-600">No other trips to link to yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {trips
              .filter((t) => t.id !== trip.id)
              .map((other) => {
                const on = related.includes(other.id);
                return (
                  <button
                    key={other.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setRelated((r) => (on ? r.filter((id) => id !== other.id) : [...r, other.id]))
                    }
                    className={cn(
                      "rounded-full border px-3.5 py-2 text-[12px] font-medium transition-colors",
                      on
                        ? "border-brand-500 bg-brand-500/15 text-white"
                        : "border-white/12 text-zinc-400 hover:border-white/30 hover:text-white"
                    )}
                  >
                    {other.destination}
                  </button>
                );
              })}
          </div>
        )}
        {related.map((id) => (
          <input key={id} type="hidden" name="relatedTripId" value={id} />
        ))}
      </Section>

      {/* ---------------- Save ---------------- */}
      <div className="sticky bottom-4 flex flex-wrap items-center gap-4 rounded-2xl border border-white/12 bg-panel/95 p-6 backdrop-blur-md">
        <label className="inline-flex cursor-pointer items-center gap-2.5">
          <input
            suppressHydrationWarning
            type="checkbox"
            name="published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 accent-[var(--brand)]"
          />
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white">
            {published ? <Eye className="h-3.5 w-3.5 text-emerald-400" /> : <EyeOff className="h-3.5 w-3.5 text-zinc-500" />}
            {published ? "Published" : "Draft"}
          </span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="ember-fill inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-[var(--brand-ink)] hover:ember-fill-hot disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save post
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
