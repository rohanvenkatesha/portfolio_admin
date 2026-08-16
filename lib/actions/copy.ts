"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { adminDb, getAdminUser } from "@/lib/firebase/admin";
import { COPY_DOC, COPY_TAG, SETTINGS_COLLECTION } from "@/lib/content/copy";
import { COPY_IDS, DEFAULT_COPY, normaliseCopy, type Copy } from "@/content/copy";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

/** Server Actions are public POST endpoints — re-check auth in every one. */
async function requireAdmin(): Promise<{ email: string } | null> {
  const user = await getAdminUser();
  if (!user?.email) return null;
  return { email: user.email };
}

async function write(copy: Copy, email: string) {
  await adminDb()
    .collection(SETTINGS_COLLECTION)
    .doc(COPY_DOC)
    .set({ ...copy, updatedAt: new Date().toISOString(), updatedBy: email });

  revalidateTag(COPY_TAG, "max");
  // Copy appears on the home page and in the footer, which every route renders.
  revalidatePath("/", "layout");
}

export async function saveCopy(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  /**
   * Fields are namespaced `<sectionId>.<field>`, so one form covers all nine
   * sections without the client having to serialise anything itself.
   */
  const raw: Record<string, Record<string, string>> = {};
  for (const id of COPY_IDS) {
    raw[id] = {
      eyebrow: String(formData.get(`${id}.eyebrow`) ?? ""),
      titleLead: String(formData.get(`${id}.titleLead`) ?? ""),
      titleAccent: String(formData.get(`${id}.titleAccent`) ?? ""),
      description: String(formData.get(`${id}.description`) ?? ""),
    };
  }

  // Same normaliser as the read path, so a cleared field falls back to the repo
  // value rather than leaving a section with no headline.
  const copy = normaliseCopy(raw);

  try {
    await write(copy, admin.email);
    return { ok: true, message: "Saved — the headings are live." };
  } catch (error) {
    console.error("[saveCopy]", error);
    return { ok: false, error: "Could not save. Check the server logs." };
  }
}

export async function resetCopy(): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    await write(DEFAULT_COPY, admin.email);
    return { ok: true, message: "Reset to the original wording." };
  } catch (error) {
    console.error("[resetCopy]", error);
    return { ok: false, error: "Could not reset." };
  }
}
