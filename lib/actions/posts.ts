"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { adminDb, getAdminUser } from "@/lib/firebase/admin";
import { POSTS_COLLECTION, POSTS_DOC, POSTS_TAG, getAllPostsRaw } from "@/lib/content/posts";
import { isValidMediaPath } from "@/lib/content/media";
import { SOCIAL_ICONS, type SocialIcon } from "@/content/profile";
import {
  normalisePost,
  youtubeId,
  type PostBlock,
  type Rider,
  type TripPost,
  type Waypoint,
} from "@/content/posts";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

/** Server Actions are public POST endpoints — re-check auth in every one. */
async function requireAdmin(): Promise<{ email: string } | null> {
  const user = await getAdminUser();
  if (!user?.email) return null;
  return { email: user.email };
}

function postsDoc() {
  return adminDb().collection(POSTS_COLLECTION).doc(POSTS_DOC);
}

async function write(items: TripPost[], email: string) {
  await postsDoc().set({ items, updatedAt: new Date().toISOString(), updatedBy: email });

  revalidateTag(POSTS_TAG, "max");
  revalidatePath("/travel/[slug]", "page");
  revalidatePath("/travel/[slug]/[post]", "page");
}

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

/** URL-safe slug. Falls back to the id so a post always has a reachable path. */
function slugify(value: string, fallback: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || fallback;
}

/* -------------------------------------------------------------------------- */
/* Parsing the editor's repeating rows                                         */
/* -------------------------------------------------------------------------- */

/**
 * Blocks arrive as parallel arrays, one entry per row, because that's what a
 * plain HTML form produces from repeated field names. `blockType` is the
 * anchor: every other array is indexed against it, and fields that don't apply
 * to a given type are simply ignored.
 */
function parseBlocks(form: FormData): PostBlock[] {
  const types = form.getAll("blockType").map(String);
  const bodies = form.getAll("blockBody").map(String);
  const captions = form.getAll("blockCaption").map(String);

  return types.flatMap((type, i): PostBlock[] => {
    const body = (bodies[i] ?? "").trim();
    const caption = (captions[i] ?? "").trim();
    if (!body) return [];

    switch (type) {
      case "text":
        return [{ type: "text", body }];
      case "heading":
        return [{ type: "heading", text: body }];
      case "image":
        // Reject anything that isn't a committed repo path, the same rule
        // covers and photos already follow.
        return isValidMediaPath(body)
          ? [{ type: "image", src: body, ...(caption ? { caption } : {}) }]
          : [];
      case "gallery": {
        // One path per line, so a gallery is a paste rather than a repeater.
        const images = body
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line && isValidMediaPath(line))
          .map((src) => ({ src }));
        return images.length ? [{ type: "gallery", images }] : [];
      }
      case "quote":
        return [{ type: "quote", text: body, ...(caption ? { attribution: caption } : {}) }];
      case "video":
        // Store only what parses as a YouTube link; the embed src is rebuilt
        // from the id at render time.
        return youtubeId(body) ? [{ type: "video", url: body, ...(caption ? { caption } : {}) }] : [];
      default:
        return [];
    }
  });
}

function parseRoute(form: FormData): Waypoint[] {
  const names = form.getAll("wpName").map(String);
  const lats = form.getAll("wpLat").map(String);
  const lngs = form.getAll("wpLng").map(String);
  const notes = form.getAll("wpNote").map(String);

  return names.flatMap((rawName, i): Waypoint[] => {
    const name = rawName.trim();
    if (!name) return [];

    const lat = Number(lats[i]);
    const lng = Number(lngs[i]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];

    const note = (notes[i] ?? "").trim();
    return [{ name, lat, lng, ...(note ? { note } : {}) }];
  });
}

function parseRiders(form: FormData): Rider[] {
  const names = form.getAll("riderName").map(String);
  const handles = form.getAll("riderHandle").map(String);
  const hrefs = form.getAll("riderHref").map(String);
  const icons = form.getAll("riderIcon").map(String);

  return names.flatMap((rawName, i): Rider[] => {
    const name = rawName.trim();
    if (!name) return [];

    const handle = (handles[i] ?? "").trim();
    const href = (hrefs[i] ?? "").trim();
    const icon = SOCIAL_ICONS.includes(icons[i] as SocialIcon) ? (icons[i] as SocialIcon) : "mail";

    return [{ name, href, icon, ...(handle ? { handle } : {}) }];
  });
}

function parseStats(form: FormData): { label: string; value: string }[] {
  const labels = form.getAll("statLabel").map(String);
  const values = form.getAll("statValue").map(String);

  return labels.flatMap((rawLabel, i) => {
    const label = rawLabel.trim();
    const value = (values[i] ?? "").trim();
    return label && value ? [{ label, value }] : [];
  });
}

/* -------------------------------------------------------------------------- */
/* Actions                                                                     */
/* -------------------------------------------------------------------------- */

export async function createPost(tripId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };
  if (!tripId) return { ok: false, error: "Missing trip." };

  try {
    // The whole set, trash included: `write` replaces the document, so an
    // action that read only the live posts would purge the trash on save.
    const current = await getAllPostsRaw();
    const stamp = Date.now().toString(36);

    const post: TripPost = {
      id: `po-${stamp}`,
      tripId,
      slug: `new-post-${stamp}`,
      title: "New post",
      excerpt: "",
      date: new Date().toISOString().slice(0, 10),
      published: false,
      // Newest first within the trip until it's given an explicit order.
      order: current.filter((p) => p.tripId === tripId && !p.deletedAt).length,
      blocks: [],
      route: [],
      stats: [],
      riders: [],
      relatedTripIds: [],
    };

    await write([...current, post], admin.email);
    return { ok: true, message: "Draft created." };
  } catch (error) {
    console.error("[createPost]", error);
    return { ok: false, error: "Could not create the post." };
  }
}

export async function savePost(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  const id = text(formData, "id");
  const title = text(formData, "title");
  if (!id) return { ok: false, error: "Missing post id." };
  if (!title) return { ok: false, error: "A post needs a title." };

  const cover = text(formData, "coverUrl");
  if (cover && !isValidMediaPath(cover)) {
    return { ok: false, error: "The cover must be an image committed under public/media." };
  }

  try {
    const current = await getAllPostsRaw();
    const index = current.findIndex((p) => p.id === id && !p.deletedAt);
    if (index === -1) return { ok: false, error: "That post no longer exists." };

    const slug = slugify(text(formData, "slug") || title, id);

    // Slugs form the URL and are scoped to a trip, so only clashes within the
    // same trip matter. Trashed posts are ignored: nothing serves them, and
    // holding a URL hostage from the trash would be baffling. `restorePost`
    // resolves the reverse case by suffixing on the way back out.
    const clash = current.some(
      (p) => p.id !== id && !p.deletedAt && p.tripId === current[index].tripId && p.slug === slug
    );
    if (clash) {
      return { ok: false, error: `Another post in this trip already uses "${slug}".` };
    }

    const items = [...current];
    items[index] = normalisePost({
      ...current[index],
      slug,
      title,
      excerpt: text(formData, "excerpt"),
      date: text(formData, "date"),
      coverUrl: cover || undefined,
      published: formData.get("published") === "on",
      order: Number(formData.get("order")) || 0,
      blocks: parseBlocks(formData),
      route: parseRoute(formData),
      stats: parseStats(formData),
      riders: parseRiders(formData),
      relatedTripIds: formData.getAll("relatedTripId").map(String).filter(Boolean),
    });

    await write(items, admin.email);
    return {
      ok: true,
      message: items[index].published ? `Published “${title}”.` : `Saved draft “${title}”.`,
    };
  } catch (error) {
    console.error("[savePost]", error);
    return { ok: false, error: "Could not save. Check the server logs." };
  }
}

/**
 * Move a post to the trash.
 *
 * A soft delete: the record stays, stamped with when it went. A post is
 * usually hours of writing, and the previous behaviour removed it from the
 * document with nothing to recover from.
 */
export async function deletePost(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    const current = await getAllPostsRaw();
    const index = current.findIndex((p) => p.id === id && !p.deletedAt);
    if (index === -1) return { ok: false, error: "That post no longer exists." };

    const items = [...current];
    items[index] = { ...items[index], deletedAt: new Date().toISOString() };

    await write(items, admin.email);
    return { ok: true, message: `Moved “${items[index].title}” to the trash.` };
  } catch (error) {
    console.error("[deletePost]", error);
    return { ok: false, error: "Could not delete." };
  }
}

export async function restorePost(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    const current = await getAllPostsRaw();
    const index = current.findIndex((p) => p.id === id && p.deletedAt);
    if (index === -1) return { ok: false, error: "That post isn't in the trash." };

    const post = current[index];

    /**
     * Slugs are only unique among live posts, so one can be taken while this
     * sat in the trash. Suffixing beats refusing — the post comes back either
     * way, and a changed URL is easier to fix than a restore that won't run.
     */
    let slug = post.slug;
    const taken = (candidate: string) =>
      current.some(
        (p) => p.id !== id && !p.deletedAt && p.tripId === post.tripId && p.slug === candidate
      );
    if (taken(slug)) {
      let n = 2;
      while (taken(`${post.slug}-${n}`)) n += 1;
      slug = `${post.slug}-${n}`;
    }

    const items = [...current];
    // Restored as a draft whatever it was before: after time in the trash you
    // should decide it's ready, not have it reappear live.
    const revived = { ...post, slug, published: false };
    delete revived.deletedAt;
    items[index] = revived;

    await write(items, admin.email);
    return {
      ok: true,
      message:
        slug === post.slug
          ? `Restored “${post.title}” as a draft.`
          : `Restored “${post.title}” as a draft — its slug was taken, so it's now “${slug}”.`,
    };
  } catch (error) {
    console.error("[restorePost]", error);
    return { ok: false, error: "Could not restore." };
  }
}

/** Permanent. Only reachable from the trash. */
export async function purgePost(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    const current = await getAllPostsRaw();
    const post = current.find((p) => p.id === id && p.deletedAt);
    if (!post) return { ok: false, error: "That post isn't in the trash." };

    await write(
      current.filter((p) => p.id !== id),
      admin.email
    );
    return { ok: true, message: `Deleted “${post.title}” for good.` };
  } catch (error) {
    console.error("[purgePost]", error);
    return { ok: false, error: "Could not delete." };
  }
}

/** Flip published state without opening the editor. */
export async function togglePostPublished(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    const current = await getAllPostsRaw();
    const index = current.findIndex((p) => p.id === id && !p.deletedAt);
    if (index === -1) return { ok: false, error: "That post no longer exists." };

    const items = [...current];
    items[index] = { ...items[index], published: !items[index].published };

    await write(items, admin.email);
    return {
      ok: true,
      message: items[index].published
        ? `“${items[index].title}” is live.`
        : `“${items[index].title}” is back to a draft.`,
    };
  } catch (error) {
    console.error("[togglePostPublished]", error);
    return { ok: false, error: "Could not update." };
  }
}
