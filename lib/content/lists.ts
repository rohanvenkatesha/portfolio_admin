import "server-only";

import { unstable_cache } from "next/cache";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { DEFAULT_LISTS, normaliseLists, type Lists } from "@/content/lists";

/**
 * Server-side access to the Services and About card lists.
 *
 * Mirrors lib/content/profile.ts and lib/content/copy.ts: the shape and
 * validation live in content/lists.ts so the admin editor can import them
 * without dragging firebase-admin into the client bundle.
 */

export const LISTS_TAG = "lists";
export const SETTINGS_COLLECTION = "settings";
export const LISTS_DOC = "lists";

async function readLists(): Promise<Lists> {
  if (!isAdminConfigured()) return DEFAULT_LISTS;

  try {
    const snapshot = await adminDb().collection(SETTINGS_COLLECTION).doc(LISTS_DOC).get();
    return snapshot.exists ? normaliseLists(snapshot.data()) : DEFAULT_LISTS;
  } catch (error) {
    // Load-bearing: a Firestore outage must not take the site down.
    console.error("[lists] Firestore read failed, using defaults:", error);
    return DEFAULT_LISTS;
  }
}

export const getLists = unstable_cache(readLists, ["lists"], {
  tags: [LISTS_TAG],
  revalidate: 3600,
});

/** Uncached, for the admin editor which must show the last save. */
export async function getListsFresh(): Promise<Lists> {
  return readLists();
}
