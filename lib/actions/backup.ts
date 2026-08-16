"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { adminDb, getAdminUser } from "@/lib/firebase/admin";
import { BACKUP_DOCS } from "@/lib/content/backup";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

/** Server Actions are public POST endpoints — re-check auth in every one. */
async function requireAdmin(): Promise<{ email: string } | null> {
  const user = await getAdminUser();
  if (!user?.email) return null;
  return { email: user.email };
}

/**
 * Every cache tag the site reads through. Restoring touches all of them, so
 * they all have to be invalidated or the site keeps serving the old content
 * until each one's hour is up.
 */
const TAGS = [
  "projects",
  "photos",
  "films",
  "trips",
  "posts",
  "sections",
  "theme",
  "profile",
  "copy",
  "lists",
  "timeline",
];

const KNOWN = new Set(BACKUP_DOCS.map(([collection, doc]) => `${collection}/${doc}`));

/**
 * Replace the site's content with a previously exported snapshot.
 *
 * Destructive by design — it's what a restore is — so it validates the whole
 * file before writing anything. A partial restore, half old and half new,
 * would be worse than either state on its own.
 */
export async function restoreBackup(json: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }

  const file = (parsed ?? {}) as { version?: unknown; docs?: unknown };

  if (file.version !== 1) {
    return { ok: false, error: "Unrecognised backup format — expected version 1." };
  }
  if (!file.docs || typeof file.docs !== "object" || Array.isArray(file.docs)) {
    return { ok: false, error: "That backup has no documents in it." };
  }

  const docs = file.docs as Record<string, unknown>;

  /**
   * Only documents this app actually reads are written. A key that isn't in
   * BACKUP_DOCS is ignored rather than rejected — an older or newer export can
   * still be restored for the parts both versions understand.
   */
  const entries = Object.entries(docs).filter(
    ([key, value]) => KNOWN.has(key) && value && typeof value === "object" && !Array.isArray(value)
  );

  if (entries.length === 0) {
    return { ok: false, error: "Nothing in that file matches this site's content." };
  }

  try {
    /**
     * One batch, so the restore either lands whole or not at all. Well within
     * Firestore's 500-write limit — there are eleven documents.
     */
    const db = adminDb();
    const batch = db.batch();
    const stamp = new Date().toISOString();

    for (const [key, value] of entries) {
      const [collection, doc] = key.split("/");
      batch.set(db.collection(collection).doc(doc), {
        ...(value as Record<string, unknown>),
        restoredAt: stamp,
        restoredBy: admin.email,
      });
    }

    await batch.commit();

    for (const tag of TAGS) revalidateTag(tag, "max");
    revalidatePath("/", "layout");

    return {
      ok: true,
      message: `Restored ${entries.length} of ${KNOWN.size} documents. Reload the site to see it.`,
    };
  } catch (error) {
    console.error("[restoreBackup]", error);
    return { ok: false, error: "Could not restore. Check the server logs." };
  }
}
