import "server-only";

import { unstable_cache } from "next/cache";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import {
  sections as staticSections,
  type SectionConfig,
  type SectionId,
} from "@/content/sections";

export const SECTIONS_TAG = "sections";
export const SETTINGS_COLLECTION = "settings";
export const SECTIONS_DOC = "sections";

type SectionsDoc = { items: SectionConfig[]; updatedAt?: string };

/**
 * Merge stored state onto the code-defined list.
 *
 * The repo remains the source of truth for which sections *exist* — Firestore
 * only stores enabled/order/label. That way adding a section in code doesn't
 * require a matching Firestore write, and a stale document can never hide a
 * section that was just built.
 */
function merge(stored: SectionConfig[] | undefined): SectionConfig[] {
  if (!stored?.length) return staticSections;

  const byId = new Map(stored.map((s) => [s.id, s]));

  return staticSections.map((base) => {
    const saved = byId.get(base.id);
    if (!saved) return base;

    return {
      ...base,
      enabled: typeof saved.enabled === "boolean" ? saved.enabled : base.enabled,
      inNav: typeof saved.inNav === "boolean" ? saved.inNav : base.inNav,
      order: typeof saved.order === "number" ? saved.order : base.order,
      label: typeof saved.label === "string" && saved.label ? saved.label : base.label,
    };
  });
}

async function readSections(): Promise<SectionConfig[]> {
  if (!isAdminConfigured()) return staticSections;

  try {
    const snapshot = await adminDb().collection(SETTINGS_COLLECTION).doc(SECTIONS_DOC).get();
    if (!snapshot.exists) return staticSections;
    return merge((snapshot.data() as SectionsDoc | undefined)?.items);
  } catch (error) {
    console.error("[sections] Firestore read failed, using repo config:", error);
    return staticSections;
  }
}

export const getSections = unstable_cache(readSections, ["sections-config"], {
  tags: [SECTIONS_TAG],
  revalidate: 3600,
});

/** Uncached, for admin screens that must reflect the last save. */
export async function getSectionsFresh(): Promise<SectionConfig[]> {
  return readSections();
}

/** Enabled sections in render order. */
export async function getActiveSections(): Promise<SectionConfig[]> {
  const all = await getSections();
  return all.filter((s) => s.enabled).sort((a, b) => a.order - b.order);
}

/** Enabled sections that appear in navigation. */
export async function getNavSections(): Promise<{ id: SectionId; label: string }[]> {
  const active = await getActiveSections();
  return active.filter((s) => s.inNav).map(({ id, label }) => ({ id, label }));
}

export async function isSectionsSeeded(): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  try {
    const snapshot = await adminDb().collection(SETTINGS_COLLECTION).doc(SECTIONS_DOC).get();
    return snapshot.exists;
  } catch {
    return false;
  }
}
