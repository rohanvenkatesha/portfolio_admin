"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { adminDb, getAdminUser } from "@/lib/firebase/admin";
import {
  SECTIONS_DOC,
  SECTIONS_TAG,
  SETTINGS_COLLECTION,
  getSectionsFresh,
} from "@/lib/content/sections";
import type { SectionConfig, SectionId } from "@/content/sections";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

/** Server Actions are public POST endpoints — re-check auth in every one. */
async function requireAdmin(): Promise<{ email: string } | null> {
  const user = await getAdminUser();
  if (!user?.email) return null;
  return { email: user.email };
}

function sectionsDoc() {
  return adminDb().collection(SETTINGS_COLLECTION).doc(SECTIONS_DOC);
}

/**
 * Section visibility affects every page, not just the home page — the nav and
 * footer sitemap render on the detail routes too.
 */
function revalidateSections() {
  revalidateTag(SECTIONS_TAG, "max");
  revalidatePath("/", "layout");
}

async function write(items: SectionConfig[], email: string) {
  await sectionsDoc().set({ items, updatedAt: new Date().toISOString(), updatedBy: email });
  revalidateSections();
}

/** Show or hide a section across the whole site. */
export async function toggleSection(id: SectionId): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    const current = await getSectionsFresh();
    const index = current.findIndex((s) => s.id === id);
    if (index === -1) return { ok: false, error: "Unknown section." };

    // The hero is the page's entry point and its nav anchor — hiding it
    // would leave the site opening on a mid-page section.
    if (id === "hero" && current[index].enabled) {
      return { ok: false, error: "The hero can't be hidden — it's the top of the page." };
    }

    const items = [...current];
    items[index] = { ...items[index], enabled: !items[index].enabled };

    await write(items, admin.email);
    return {
      ok: true,
      message: `${items[index].label} is now ${items[index].enabled ? "live" : "hidden"}.`,
    };
  } catch (error) {
    console.error("[toggleSection]", error);
    return { ok: false, error: "Could not update. Check the server logs." };
  }
}

/** Include or exclude a section from the nav, without hiding the section. */
export async function toggleSectionNav(id: SectionId): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    const current = await getSectionsFresh();
    const index = current.findIndex((s) => s.id === id);
    if (index === -1) return { ok: false, error: "Unknown section." };

    const items = [...current];
    items[index] = { ...items[index], inNav: !items[index].inNav };

    await write(items, admin.email);
    return {
      ok: true,
      message: `${items[index].label} ${items[index].inNav ? "added to" : "removed from"} the nav.`,
    };
  } catch (error) {
    console.error("[toggleSectionNav]", error);
    return { ok: false, error: "Could not update." };
  }
}

/**
 * Move a section earlier or later.
 *
 * Order values are renumbered in tens after each move, so they stay readable
 * and leave gaps for anything inserted in code later.
 */
export async function moveSection(
  id: SectionId,
  direction: "up" | "down"
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    const ordered = [...(await getSectionsFresh())].sort((a, b) => a.order - b.order);
    const index = ordered.findIndex((s) => s.id === id);
    if (index === -1) return { ok: false, error: "Unknown section." };

    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= ordered.length) {
      return { ok: true, message: "Already at the end." };
    }

    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];

    const renumbered = ordered.map((section, i) => ({ ...section, order: (i + 1) * 10 }));

    await write(renumbered, admin.email);
    return { ok: true, message: "Reordered." };
  } catch (error) {
    console.error("[moveSection]", error);
    return { ok: false, error: "Could not reorder." };
  }
}
