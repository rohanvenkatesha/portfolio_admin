"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpToLine,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Heading2,
  Image as ImageIcon,
  Images,
  Loader2,
  Pilcrow,
  Plus,
  Quote,
  Save,
  Trash2,
  Video,
  type LucideIcon,
} from "lucide-react";
import { savePost, type ActionResult } from "@/lib/actions/posts";
import { BLOCK_TYPES, type BlockType, type PostBlock, type Rider, type TripPost } from "@/content/posts";
import { SOCIAL_ICONS } from "@/content/profile";
import type { MediaFile } from "@/lib/content/media";
import type { Trip } from "@/content/site";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-panel-2 px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20";

/**
 * What each block type is called, what it does, and what its fields want.
 *
 * `hint` earns its place: several of these have consequences you cannot see
 * from the editor — a heading decides where the reader's pages break, and a
 * gallery renders nothing where it sits.
 */
const BLOCK_META: Record<
  BlockType,
  { label: string; hint: string; icon: LucideIcon; body: string; caption?: string; textarea?: boolean }
> = {
  text: {
    label: "Paragraph",
    hint: "Body copy. Blank lines inside it separate paragraphs.",
    icon: Pilcrow,
    body: "Text — blank lines separate paragraphs",
    textarea: true,
  },
  heading: {
    label: "Heading",
    hint: "Also starts a new page for the reader, and names it in the pager.",
    icon: Heading2,
    body: "Heading",
  },
  image: {
    label: "Image",
    hint: "One photo, full width of the column.",
    icon: ImageIcon,
    body: "Image",
    caption: "Caption (optional)",
  },
  gallery: {
    label: "Add to gallery",
    hint: "Several photos at once. They appear in Frames, not here.",
    icon: Images,
    body: "Images",
    caption: "Descriptions",
  },
  quote: {
    label: "Pull quote",
    hint: "Set large, as a break in the writing.",
    icon: Quote,
    body: "Quote",
    caption: "Attribution (optional)",
    textarea: true,
  },
  video: {
    label: "Video",
    hint: "A YouTube link. Only the thumbnail loads until it is played.",
    icon: Video,
    body: "YouTube URL",
    caption: "Caption (optional)",
  },
};

/**
 * Editor rows carry both fields regardless of type; the action ignores what
 * doesn't apply.
 *
 * `id` is client-only and never submitted. It exists so React can key rows by
 * identity rather than position — with an index key, inserting a block above
 * another made React reuse the wrong DOM node, moving the caret and any
 * expanded state onto a different block.
 */
/** A stop being edited. Coordinates stay blank until typed. */
type RouteRow = { name: string; lat: number | ""; lng: number | ""; note?: string };

type BlockRow = { id: string; type: BlockType; body: string; caption: string };

/** Only ever called from event handlers, so it cannot desync a render. */
const newId = () => `b-${Math.random().toString(36).slice(2, 9)}`;

function toRows(blocks: PostBlock[]): BlockRow[] {
  return blocks.map((block, index): BlockRow => {
    switch (block.type) {
      case "text":
        return { id: `b-${index}`, type: "text", body: block.body, caption: "" };
      case "heading":
        return { id: `b-${index}`, type: "heading", body: block.text, caption: "" };
      case "image":
        return { id: `b-${index}`, type: "image", body: block.src, caption: block.caption ?? "" };
      case "gallery":
        return { id: `b-${index}`, type: "gallery", body: block.images.map((i) => i.src).join("\n"), caption: "" };
      case "quote":
        return { id: `b-${index}`, type: "quote", body: block.text, caption: block.attribution ?? "" };
      case "video":
        return { id: `b-${index}`, type: "video", body: block.url, caption: block.caption ?? "" };
    }
  });
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  /** One line under the title, for behaviour the controls cannot show. */
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/8 bg-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {action}
      </div>
      {description ? (
        <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-zinc-500">{description}</p>
      ) : null}
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
  /**
   * Stops, with coordinates that may be blank while being typed.
   *
   * A new stop used to start at 0,0. Those are real, finite numbers, so they
   * pass every check and put a pin in the Atlantic — the exact failure the save
   * path now rejects blanks to prevent. Starting empty means an unfilled stop
   * is reported rather than plotted.
   */
  const [route, setRoute] = useState<RouteRow[]>(post.route);
  const [riders, setRiders] = useState<Rider[]>(post.riders);
  const [stats, setStats] = useState(post.stats);
  const [related, setRelated] = useState<string[]>(post.relatedTripIds);
  const [published, setPublished] = useState(post.published);
  const [cover, setCover] = useState(post.coverUrl ?? "");

  /**
   * Collapsed block ids.
   *
   * By id, not index, because inserting or moving a block would otherwise fold
   * a different one. An array rather than a Set so the value stays plainly
   * comparable and cheap to copy at these sizes.
   */
  const [collapsed, setCollapsed] = useState<string[]>([]);

  /**
   * Whether the palette above the first block is showing.
   *
   * Every other position is reachable from the Add block below of the block
   * before it. Position zero is the exception, so it is offered from the first
   * block's own header instead of a permanent bar above the list.
   */
  const [topOpen, setTopOpen] = useState(false);

  const toggleBlock = (id: string) =>
    setCollapsed((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  /**
   * Add a block at a position rather than at the end.
   *
   * Appending was the whole problem with this editor: writing a paragraph
   * between the second and third blocks of a long post meant adding at the
   * bottom and then clicking Move up until it arrived.
   */
  const insertAt = (index: number, type: BlockType) =>
    setBlocks((b) => [
      ...b.slice(0, index),
      { id: newId(), type, body: "", caption: "" },
      ...b.slice(index),
    ]);

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
        description="Blocks render top to bottom. Every block has an Add block below it, so a new one lands where you are working rather than at the end."
      >
        {blocks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-panel-2 px-4 py-8 text-center">
            <p className="text-[12.5px] text-zinc-500">Nothing written yet.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {BLOCK_TYPES.map((type) => (
                <TypeButton key={type} type={type} onClick={() => insertAt(0, type)} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Only appears when asked for, from the first block's own control —
                there is no permanent bar at the top of the list. */}
            {topOpen ? (
              <div className="rounded-xl border border-brand-500/25 bg-brand-500/[0.04] p-2.5">
                <BlockPalette
                  onPick={(type) => {
                    insertAt(0, type);
                    setTopOpen(false);
                  }}
                  onCancel={() => setTopOpen(false)}
                />
              </div>
            ) : null}

            {blocks.map((block, index) => {
              const meta = BLOCK_META[block.type];
              const Icon = meta.icon;
              const open = !collapsed.includes(block.id);

              return (
                <div key={block.id} className="rounded-xl border border-white/8 bg-panel-2">
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    {/* The whole strip toggles, so a long post folds down to
                        a readable outline. */}
                    <button
                      type="button"
                      onClick={() => toggleBlock(block.id)}
                      aria-expanded={open}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      {open ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                      )}
                      <Icon className="h-3.5 w-3.5 shrink-0 text-brand-400" />
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-brand-400">
                        {meta.label}
                      </span>
                      {!open ? (
                        <span className="truncate text-[12px] text-zinc-500">{previewOf(block)}</span>
                      ) : null}
                    </button>

                    <div className="flex shrink-0 gap-1.5">
                      {/* Every other position is reachable from the block above
                          it; this is the one that is not. */}
                      {index === 0 ? (
                        <IconButton label="Insert block above" onClick={() => setTopOpen(true)}>
                          <ArrowUpToLine className="h-3.5 w-3.5" />
                        </IconButton>
                      ) : null}
                      <IconButton
                        label="Move up"
                        disabled={index === 0}
                        onClick={() => setBlocks((b) => move(b, index, -1))}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </IconButton>
                      <IconButton
                        label="Move down"
                        disabled={index === blocks.length - 1}
                        onClick={() => setBlocks((b) => move(b, index, 1))}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </IconButton>
                      <IconButton
                        label="Duplicate block"
                        onClick={() =>
                          setBlocks((b) => [
                            ...b.slice(0, index + 1),
                            { ...b[index], id: newId() },
                            ...b.slice(index + 1),
                          ])
                        }
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </IconButton>
                      <IconButton
                        label="Remove block"
                        danger
                        onClick={() => setBlocks((b) => b.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconButton>
                    </div>
                  </div>

                  <input type="hidden" name="blockType" value={block.type} />

                  {open ? (
                    <div className="space-y-2 border-t border-white/8 p-3">
                      <p className="text-[11px] leading-relaxed text-zinc-600">{meta.hint}</p>

                      {block.type === "image" || block.type === "gallery" ? (
                        <>
                          <input type="hidden" name="blockBody" value={block.body} />
                          <MediaGrid
                            files={media}
                            value={block.body}
                            multiple={block.type === "gallery"}
                            onChange={(next) =>
                              setBlocks((b) =>
                                b.map((row, i) => (i === index ? { ...row, body: next } : row))
                              )
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
                            setBlocks((b) =>
                              b.map((row, i) => (i === index ? { ...row, body: e.target.value } : row))
                            )
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
                            setBlocks((b) =>
                              b.map((row, i) => (i === index ? { ...row, body: e.target.value } : row))
                            )
                          }
                          className={inputClass}
                        />
                      )}

                      {/* Every row submits a caption so the arrays stay
                          aligned, even where the type has no use for one. */}
                      {block.type === "gallery" ? (
                        <GalleryCaptions
                          paths={block.body}
                          value={block.caption}
                          onChange={(next) =>
                            setBlocks((b) =>
                              b.map((row, i) => (i === index ? { ...row, caption: next } : row))
                            )
                          }
                        />
                      ) : meta.caption ? (
                        <input
                          suppressHydrationWarning
                          name="blockCaption"
                          placeholder={meta.caption}
                          value={block.caption}
                          onChange={(e) =>
                            setBlocks((b) =>
                              b.map((row, i) => (i === index ? { ...row, caption: e.target.value } : row))
                            )
                          }
                          className={inputClass}
                        />
                      ) : (
                        <input type="hidden" name="blockCaption" value="" />
                      )}
                    </div>
                  ) : (
                    /* Collapsed rows still submit, or every array after this
                       one shifts by a block. */
                    <>
                      <input type="hidden" name="blockBody" value={block.body} />
                      <input type="hidden" name="blockCaption" value={block.caption} />
                    </>
                  )}

                  {/* Inside the card, on its bottom edge: the new block belongs
                      to the one you are working in, and reads as "after this". */}
                  <InsertFooter onInsert={(type) => insertAt(index + 1, type)} />
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ---------------- Route ---------------- */}
      <Section
        title="Route"
        action={<AddButton label="Add stop" onClick={() => setRoute((r) => [...r, { name: "", lat: "", lng: "" }])} />}
      >
        {route.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 bg-panel-2 px-4 py-8 text-center text-[12px] text-zinc-600">
            No stops — the map is hidden. Add stops in the order you travelled them.
          </p>
        ) : (
          <div className="space-y-2">
            {route.map((stop, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-white/8 bg-panel-2 p-3 lg:grid-cols-[auto_1.4fr_0.7fr_0.7fr_1.4fr_auto]">
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
              <div key={index} className="grid gap-2 rounded-xl border border-white/8 bg-panel-2 p-3 lg:grid-cols-[1fr_0.8fr_1.4fr_auto_auto]">
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
      {/* Pinned only from lg. On a phone or tablet a 140px bar 16px off the
          bottom sits exactly where the on-screen keyboard puts the field you
          are typing into. */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/12 bg-panel/95 p-5 backdrop-blur-md sm:p-6 lg:sticky lg:bottom-4">
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


/**
 * Per-image descriptions for a gallery block.
 *
 * A gallery's paths come from the media picker, so they can't carry a caption
 * inline the way a single image's field does. The captions ride in the block's
 * one caption field instead, newline-joined and aligned to the paths by index —
 * the same shape the action already expects, so nothing new had to be threaded
 * through the form.
 *
 * Descriptions are what the gallery shows as each frame's label, so without
 * this every bulk-added image was stuck reading "Frame 04".
 */
function GalleryCaptions({
  paths,
  value,
  onChange,
}: {
  paths: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const list = paths
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const captions = value.split("\n");

  if (list.length === 0) {
    // Nothing picked yet — still submit the field so the arrays stay aligned.
    return <input type="hidden" name="blockCaption" value={value} />;
  }

  const setAt = (index: number, next: string) => {
    // Padded to the path count so a caption typed against the last image can't
    // land on an earlier one once the value is split again.
    const filled = Array.from({ length: list.length }, (_, i) => captions[i] ?? "");
    filled[index] = next.replace(/\n/g, " ");
    onChange(filled.join("\n"));
  };

  return (
    <div className="space-y-2">
      <input type="hidden" name="blockCaption" value={value} />
      {list.map((path, i) => (
        <label key={path + i} className="flex items-center gap-2.5">
          <span className="w-28 shrink-0 truncate font-mono text-[10.5px] text-zinc-600">
            {path.split("/").pop()}
          </span>
          <input
            suppressHydrationWarning
            placeholder="Description (optional)"
            value={captions[i] ?? ""}
            onChange={(e) => setAt(i, e.target.value)}
            className={inputClass}
          />
        </label>
      ))}
    </div>
  );
}

/**
 * A block type, offered as a labelled button.
 *
 * The icon matters more than it looks: the six types are told apart at a
 * glance while scanning a long body, where six similar words are not.
 */
function TypeButton({ type, onClick }: { type: BlockType; onClick: () => void }) {
  const meta = BLOCK_META[type];
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      title={meta.hint}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-[12px] font-medium text-zinc-400 transition-colors hover:border-brand-500/50 hover:text-brand-300"
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </button>
  );
}

/** The row of block types, shown once something has asked to insert. */
function BlockPalette({
  onPick,
  onCancel,
}: {
  onPick: (type: BlockType) => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {BLOCK_TYPES.map((type) => (
        <TypeButton key={type} type={type} onClick={() => onPick(type)} />
      ))}
      <button
        type="button"
        onClick={onCancel}
        className="ml-auto rounded-full px-2.5 py-1.5 text-[12px] text-zinc-500 transition-colors hover:text-zinc-200"
      >
        Cancel
      </button>
    </div>
  );
}

/**
 * Add a block directly after this one, from inside its own card.
 *
 * This was a divider floating between cards, which belonged to neither and put
 * the only obvious way in at the top of the list — so adding anything meant
 * scrolling back up. On the block's bottom edge it reads as "after this one",
 * which is both where you are looking and the position you want.
 *
 * Click to open rather than reveal on hover: the admin gets used on a phone,
 * and a control you cannot reach on touch is not a control.
 */
function InsertFooter({ onInsert }: { onInsert: (type: BlockType) => void }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="border-t border-white/8 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11.5px] font-medium text-zinc-600 transition-colors hover:text-brand-400"
        >
          <Plus className="h-3.5 w-3.5" />
          Add block below
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-brand-500/25 bg-brand-500/[0.04] p-2.5">
      <BlockPalette
        onPick={(type) => {
          onInsert(type);
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}

/** One line describing a folded block, so the outline is readable. */
function previewOf(block: BlockRow): string {
  if (block.type === "gallery" || block.type === "image") {
    const files = block.body.split("\n").map((l) => l.trim()).filter(Boolean);
    if (files.length === 0) return "No image chosen";
    if (block.type === "image") return files[0].split("/").pop() ?? "";
    return `${files.length} image${files.length === 1 ? "" : "s"}`;
  }

  const text = block.body.trim().replace(/\s+/g, " ");
  if (!text) return "Empty";
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}
