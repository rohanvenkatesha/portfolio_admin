import "server-only";

import { unstable_cache } from "next/cache";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { DEFAULT_COPY, normaliseCopy, type Copy } from "@/content/copy";

/**
 * Server-side section copy.
 *
 * One document holding every section's heading, rather than a document each:
 * it's always read as a whole, always written as a whole from one form, and a
 * single read is cheaper than nine.
 */

export const COPY_TAG = "copy";
export const SETTINGS_COLLECTION = "settings";
export const COPY_DOC = "copy";

async function readCopy(): Promise<Copy> {
  if (!isAdminConfigured()) return DEFAULT_COPY;

  try {
    const snapshot = await adminDb().collection(SETTINGS_COLLECTION).doc(COPY_DOC).get();
    return snapshot.exists ? normaliseCopy(snapshot.data()) : DEFAULT_COPY;
  } catch (error) {
    // A Firestore outage must not take the site down — fall back to the repo.
    console.error("[copy] Firestore read failed, using defaults:", error);
    return DEFAULT_COPY;
  }
}

export const getCopy = unstable_cache(readCopy, ["copy"], {
  tags: [COPY_TAG],
  revalidate: 3600,
});

/** Uncached, for the admin editor which must show the last save. */
export async function getCopyFresh(): Promise<Copy> {
  return readCopy();
}
