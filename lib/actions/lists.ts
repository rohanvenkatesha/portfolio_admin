"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { adminDb, getAdminUser } from "@/lib/firebase/admin";
import { LISTS_DOC, LISTS_TAG, SETTINGS_COLLECTION } from "@/lib/content/lists";
import {
  DEFAULT_LISTS,
  SKILL_ACCENTS,
  SKILL_DOMAINS,
  normaliseLists,
  textToSkills,
  type Lists,
  type SkillAccent,
  type SkillDomain,
} from "@/content/lists";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

/** Server Actions are public POST endpoints — re-check auth in every one. */
async function requireAdmin(): Promise<{ email: string } | null> {
  const user = await getAdminUser();
  if (!user?.email) return null;
  return { email: user.email };
}

async function write(lists: Lists, email: string) {
  await adminDb()
    .collection(SETTINGS_COLLECTION)
    .doc(LISTS_DOC)
    .set({ ...lists, updatedAt: new Date().toISOString(), updatedBy: email });

  revalidateTag(LISTS_TAG, "max");
  // Services and About are both on the home page.
  revalidatePath("/", "layout");
}

/** Comma-separated chips, the way tags are typed rather than stored. */
function toTags(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export async function saveLists(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  /**
   * Each list arrives as parallel arrays of same-named inputs, which is what a
   * plain form produces from repeated fields. DOM order is the stored order, so
   * reordering a row in the editor is the whole of reordering the data.
   */
  const all = (key: string) => formData.getAll(key).map(String);

  const capNumbers = all("capNumber");
  const capTitles = all("capTitle");
  const capBodies = all("capBody");
  const capTags = formData.getAll("capTags");

  const statValues = all("statValue");
  const statSuffixes = all("statSuffix");
  const statLabels = all("statLabel");

  const prTitles = all("prTitle");
  const prBodies = all("prBody");

  const sgIds = all("sgId");
  const sgLabels = all("sgLabel");
  const sgDomains = all("sgDomain");
  const sgAccents = all("sgAccent");
  const sgSkills = all("sgSkills");

  // Everything goes through the same normaliser as the read path, so blank or
  // malformed rows are dropped rather than saved as empty slots on the page.
  const lists = normaliseLists({
    capabilities: capTitles.map((title, i) => ({
      number: capNumbers[i] ?? "",
      title,
      body: capBodies[i] ?? "",
      tags: toTags(capTags[i] ?? null),
    })),
    stats: statLabels.map((label, i) => ({
      value: Number(statValues[i] ?? 0),
      suffix: statSuffixes[i] ?? "",
      label,
    })),
    philosophy: prTitles.map((title, i) => ({ title, body: prBodies[i] ?? "" })),
    skillGroups: sgLabels.map((label, i) => ({
      id: sgIds[i] ?? "",
      label,
      domain: (SKILL_DOMAINS.includes(sgDomains[i] as SkillDomain)
        ? sgDomains[i]
        : "engineering") as SkillDomain,
      accent: (SKILL_ACCENTS.includes(sgAccents[i] as SkillAccent)
        ? sgAccents[i]
        : "cyan") as SkillAccent,
      skills: textToSkills(sgSkills[i] ?? ""),
    })),
  });

  // The About section indexes skillGroups[0] to pick its open row, so an empty
  // list would take the home page down.
  if (lists.skillGroups.length === 0) {
    return { ok: false, error: "Keep at least one skill group — the About section needs one." };
  }

  try {
    await write(lists, admin.email);
    return { ok: true, message: "Saved — the home page has been updated." };
  } catch (error) {
    console.error("[saveLists]", error);
    return { ok: false, error: "Could not save. Check the server logs." };
  }
}

export async function resetLists(): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    await write(DEFAULT_LISTS, admin.email);
    return { ok: true, message: "Reset to the content in the repo." };
  } catch (error) {
    console.error("[resetLists]", error);
    return { ok: false, error: "Could not reset." };
  }
}
