/**
 * Trip blog posts.
 *
 * A trip is the guide — itinerary, gear, budget. A post is a piece of writing
 * that hangs off it: a day, a leg, a gear breakdown, a story. Many posts per
 * trip, each with its own URL at /travel/[trip]/[post].
 *
 * Free of server imports so the admin editor can share these types.
 *
 * ## Why the body is blocks rather than markup
 *
 * Every block renders through the site's own components, so a post can't break
 * the layout and nothing an editor types is ever interpreted as markup. That
 * removes the whole class of injection bugs that comes with storing HTML, and
 * it's why there is no sanitiser anywhere in this file.
 */

import { SOCIAL_ICONS, type SocialIcon } from "@/content/profile";
import { isValidMediaPath } from "@/content/media-path";

export type Waypoint = {
  /** Shown in the pin's popup. */
  name: string;
  lat: number;
  lng: number;
  /** Optional line under the name. */
  note?: string;
};

export type Rider = {
  name: string;
  /** Displayed under the name, e.g. "@handle". */
  handle?: string;
  href: string;
  icon: SocialIcon;
};

export type PostBlock =
  | { type: "text"; body: string }
  | { type: "heading"; text: string }
  | { type: "image"; src: string; caption?: string }
  | { type: "gallery"; images: { src: string; caption?: string }[] }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "video"; url: string; caption?: string };

export type BlockType = PostBlock["type"];

export const BLOCK_TYPES: BlockType[] = [
  "text",
  "heading",
  "image",
  "gallery",
  "quote",
  "video",
];

export type TripPost = {
  id: string;
  /** Owning trip. A post always belongs to exactly one. */
  tripId: string;
  slug: string;
  title: string;
  /** One or two sentences, shown in listings and as the meta description. */
  excerpt: string;
  /** ISO date (YYYY-MM-DD). Sorts the listing. */
  date: string;
  coverUrl?: string;
  /** Drafts are invisible to the public site until published. */
  published: boolean;
  /** Manual ordering within a trip, low first; date breaks ties. */
  order: number;
  blocks: PostBlock[];
  /** Ordered stops, drawn as a line with numbered pins. */
  route: Waypoint[];
  /** Figures specific to this leg, distinct from the trip's own totals. */
  stats: { label: string; value: string }[];
  riders: Rider[];
  /** Ids of other trips this post relates to. */
  relatedTripIds: string[];
};

/* -------------------------------------------------------------------------- */
/* Normalising                                                                 */
/* -------------------------------------------------------------------------- */

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function strList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string" && v.trim() !== "").map((v) => v.trim())
    : [];
}

/**
 * Coordinates are clamped rather than dropped: a waypoint outside the real
 * range would be silently relocated by Leaflet, and a pin in the wrong
 * hemisphere is harder to spot than one pinned to the edge.
 */
function waypoints(value: unknown): Waypoint[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((raw): Waypoint[] => {
    const w = (raw ?? {}) as Partial<Waypoint>;
    const name = str(w.name);
    if (!name) return [];

    const lat = Math.max(-90, Math.min(90, num(w.lat)));
    const lng = Math.max(-180, Math.min(180, num(w.lng)));
    const note = str(w.note);

    return [note ? { name, lat, lng, note } : { name, lat, lng }];
  });
}

function riders(value: unknown): Rider[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((raw): Rider[] => {
    const r = (raw ?? {}) as Partial<Rider>;
    const name = str(r.name);
    const href = str(r.href);
    // A rider with no link is just a name — keep it, drop the dead anchor.
    if (!name) return [];

    const icon = SOCIAL_ICONS.includes(r.icon as SocialIcon) ? (r.icon as SocialIcon) : "mail";
    const handle = str(r.handle);

    return [{ name, href, icon, ...(handle ? { handle } : {}) }];
  });
}

function blocks(value: unknown): PostBlock[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((raw): PostBlock[] => {
    const b = (raw ?? {}) as { type?: string; [key: string]: unknown };

    switch (b.type) {
      case "text": {
        const body = str(b.body);
        return body ? [{ type: "text", body }] : [];
      }
      case "heading": {
        const text = str(b.text);
        return text ? [{ type: "heading", text }] : [];
      }
      /**
       * Image sources are re-checked here, not just on write. A document can
       * be written straight to Firestore, and an off-site URL reaching
       * next/image throws at render — so an unvalidated read would let one bad
       * record take the whole page down with a 500, as well as pointing site
       * imagery anywhere.
       */
      case "image": {
        const src = str(b.src);
        const caption = str(b.caption);
        return isValidMediaPath(src) ? [{ type: "image", src, ...(caption ? { caption } : {}) }] : [];
      }
      case "gallery": {
        const images = Array.isArray(b.images)
          ? b.images.flatMap((img): { src: string; caption?: string }[] => {
              const i = (img ?? {}) as { src?: string; caption?: string };
              const src = str(i.src);
              const caption = str(i.caption);
              return isValidMediaPath(src) ? [{ src, ...(caption ? { caption } : {}) }] : [];
            })
          : [];
        return images.length ? [{ type: "gallery", images }] : [];
      }
      case "quote": {
        const text = str(b.text);
        const attribution = str(b.attribution);
        return text ? [{ type: "quote", text, ...(attribution ? { attribution } : {}) }] : [];
      }
      case "video": {
        const url = str(b.url);
        const caption = str(b.caption);
        return url ? [{ type: "video", url, ...(caption ? { caption } : {}) }] : [];
      }
      default:
        // Unknown block type — drop it rather than render an empty slot.
        return [];
    }
  });
}

export function normalisePost(raw: unknown): TripPost {
  const p = (raw ?? {}) as Partial<TripPost>;

  return {
    id: str(p.id),
    tripId: str(p.tripId),
    slug: str(p.slug),
    title: str(p.title),
    excerpt: str(p.excerpt),
    date: str(p.date),
    coverUrl: isValidMediaPath(str(p.coverUrl)) ? str(p.coverUrl) : undefined,
    // Anything not explicitly true stays a draft, so a malformed record can
    // never publish itself.
    published: p.published === true,
    order: num(p.order),
    blocks: blocks(p.blocks),
    route: waypoints(p.route),
    stats: Array.isArray(p.stats)
      ? p.stats.flatMap((s) => {
          const label = str((s as { label?: string })?.label);
          const value = str((s as { value?: string })?.value);
          return label && value ? [{ label, value }] : [];
        })
      : [],
    riders: riders(p.riders),
    relatedTripIds: strList(p.relatedTripIds),
  };
}

/** Manual order first, then newest — so pinning a post doesn't fight the date. */
export function sortPosts(posts: TripPost[]): TripPost[] {
  return [...posts].sort((a, b) => a.order - b.order || b.date.localeCompare(a.date));
}

/* -------------------------------------------------------------------------- */
/* YouTube                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Pull the video id out of any YouTube URL shape.
 *
 * Returning an id rather than trusting the URL is deliberate: the embed src is
 * then built from a known-good template, so a pasted link can never point the
 * iframe somewhere else.
 */
export function youtubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export function youtubeEmbedUrl(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

export function youtubeThumbnail(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
