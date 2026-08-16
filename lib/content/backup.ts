import "server-only";

import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";

/**
 * Snapshot and restore for everything the site reads out of Firestore.
 *
 * Deliberately broader than a trash. A trash only catches deletions made
 * through the admin; it does nothing about a bulk save that replaces nine
 * timeline entries with nonsense, and nothing about a script writing the wrong
 * thing to a document — which is how a post was lost while this was being
 * built. A whole-database snapshot covers all three.
 *
 * There are no secrets in here. Every document is content that is already
 * public on the site; the route is gated because it's admin, not because the
 * payload is sensitive.
 */

/** Every document the site reads. Adding a new one? Add it here too. */
export const BACKUP_DOCS = [
  ["content", "projects"],
  ["content", "photos"],
  ["content", "films"],
  ["content", "trips"],
  ["content", "posts"],
  ["settings", "sections"],
  ["settings", "theme"],
  ["settings", "profile"],
  ["settings", "copy"],
  ["settings", "lists"],
  ["settings", "timeline"],
] as const;

export type BackupFile = {
  /** Bumped only if the shape below changes incompatibly. */
  version: 1;
  exportedAt: string;
  project: string;
  /** Keyed "collection/doc". Documents that don't exist are simply absent. */
  docs: Record<string, Record<string, unknown>>;
};

export async function readBackup(): Promise<BackupFile> {
  if (!isAdminConfigured()) {
    throw new Error("Firebase admin is not configured.");
  }

  const db = adminDb();
  const docs: BackupFile["docs"] = {};

  await Promise.all(
    BACKUP_DOCS.map(async ([collection, doc]) => {
      const snapshot = await db.collection(collection).doc(doc).get();
      // Absent rather than null: restoring should leave a document that never
      // existed still not existing, not create an empty one.
      if (snapshot.exists) docs[`${collection}/${doc}`] = snapshot.data() ?? {};
    })
  );

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    project: process.env.FIREBASE_PROJECT_ID ?? "unknown",
    docs,
  };
}

/** A filename that sorts chronologically and says what it is. */
export function backupFilename(exportedAt: string): string {
  const stamp = exportedAt.replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
  return `portfolio-backup_${stamp}.json`;
}
