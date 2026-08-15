"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { adminDb, getAdminUser } from "@/lib/firebase/admin";
import {
  PROJECTS_COLLECTION,
  PROJECTS_DOC,
  PROJECTS_TAG,
  getProjectsFresh,
} from "@/lib/content/projects";
import { isValidMediaPath } from "@/lib/content/media";
import { projects as staticProjects, type Project } from "@/content/site";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

/**
 * Covers are repo images under public/media, not remote URLs — so the check is
 * a path shape rather than a hostname. Without it, a crafted request could
 * point site imagery anywhere.
 */
function safeCoverPath(raw: string): string | null | false {
  const value = raw.trim();
  if (!value) return null; // cleared
  return isValidMediaPath(value) ? value : false;
}

/**
 * Every action re-checks authorisation on the server.
 *
 * Server Actions are POST endpoints with public URLs — being rendered inside a
 * gated layout does not protect them. The layout guard stops people *seeing*
 * the admin UI; this stops them *calling* it.
 */
async function requireAdmin(): Promise<{ email: string } | null> {
  const user = await getAdminUser();
  if (!user?.email) return null;
  return { email: user.email };
}

function projectsDoc() {
  return adminDb().collection(PROJECTS_COLLECTION).doc(PROJECTS_DOC);
}

/**
 * Invalidate every surface that renders project data.
 *
 * "max" gives stale-while-revalidate: visitors keep getting an instant cached
 * page while the new one builds in the background. The admin screens read
 * uncached (getProjectsFresh), so you always see your own edit immediately —
 * only the public site trades a moment of staleness for staying fast.
 */
function revalidateProjects() {
  revalidateTag(PROJECTS_TAG, "max");
  revalidatePath("/");
  revalidatePath("/work/[slug]", "page");
}

/**
 * Copy the checked-in projects into Firestore, once.
 *
 * Refuses to run if data already exists, so it can't silently overwrite edits.
 */
export async function seedProjects(): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    const snapshot = await projectsDoc().get();
    const existing = (snapshot.data()?.items ?? []) as Project[];

    if (existing.length > 0) {
      return {
        ok: false,
        error: `Firestore already holds ${existing.length} projects. Seeding would overwrite them.`,
      };
    }

    await projectsDoc().set({
      items: staticProjects,
      updatedAt: new Date().toISOString(),
      updatedBy: admin.email,
    });

    revalidateProjects();
    return { ok: true, message: `Seeded ${staticProjects.length} projects into Firestore.` };
  } catch (error) {
    console.error("[seedProjects]", error);
    return { ok: false, error: "Could not write to Firestore. Check the server logs." };
  }
}

/** Persist edits to a single project, leaving the rest of the list untouched. */
export async function saveProject(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing project id." };

  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();

  if (title.length < 2) return { ok: false, error: "Title is too short." };
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { ok: false, error: "Slug must be lowercase letters, numbers and hyphens only." };
  }

  // Multi-line textareas become arrays, one entry per non-empty line.
  const toList = (value: FormDataEntryValue | null) =>
    String(value ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const cover = safeCoverPath(String(formData.get("coverUrl") ?? ""));
  if (cover === false) {
    return { ok: false, error: "That image path is not under public/media." };
  }

  try {
    const current = await getProjectsFresh();

    // A slug collision would make two projects fight over the same URL.
    if (current.some((p) => p.slug === slug && p.id !== id)) {
      return { ok: false, error: `Another project already uses the slug "${slug}".` };
    }

    const index = current.findIndex((p) => p.id === id);
    if (index === -1) return { ok: false, error: "That project no longer exists." };

    const updated: Project = {
      ...current[index],
      title,
      slug,
      blurb: String(formData.get("blurb") ?? "").trim(),
      category: String(formData.get("category") ?? current[index].category) as Project["category"],
      accent: String(formData.get("accent") ?? current[index].accent) as Project["accent"],
      stack: toList(formData.get("stack")),
      highlights: toList(formData.get("highlights")),
      featured: formData.get("featured") === "on",
      coverUrl: cover ?? undefined,
      repo: String(formData.get("repo") ?? "").trim() || undefined,
      demo: String(formData.get("demo") ?? "").trim() || undefined,
      year: String(formData.get("year") ?? "").trim() || undefined,
    };

    const items = [...current];
    items[index] = updated;

    await projectsDoc().set({
      items,
      updatedAt: new Date().toISOString(),
      updatedBy: admin.email,
    });

    revalidateProjects();
    return { ok: true, message: `Saved “${updated.title}”.` };
  } catch (error) {
    console.error("[saveProject]", error);
    return { ok: false, error: "Could not save. Check the server logs." };
  }
}

/** Toggle the home-page featured flag without opening the full editor. */
export async function toggleFeatured(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    const current = await getProjectsFresh();
    const index = current.findIndex((p) => p.id === id);
    if (index === -1) return { ok: false, error: "That project no longer exists." };

    const items = [...current];
    items[index] = { ...items[index], featured: !items[index].featured };

    await projectsDoc().set({
      items,
      updatedAt: new Date().toISOString(),
      updatedBy: admin.email,
    });

    revalidateProjects();
    return {
      ok: true,
      message: `${items[index].title} is ${items[index].featured ? "now featured" : "no longer featured"}.`,
    };
  } catch (error) {
    console.error("[toggleFeatured]", error);
    return { ok: false, error: "Could not update. Check the server logs." };
  }
}
