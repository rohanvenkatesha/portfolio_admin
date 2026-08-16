import "server-only";

import { unstable_cache } from "next/cache";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { DEFAULT_PROFILE, normaliseProfile, type Profile } from "@/content/profile";

/**
 * Server-side profile access.
 *
 * Mirrors lib/content/theme.ts: the shape and validation live in
 * content/profile.ts so the admin form can import them without dragging
 * firebase-admin into the client bundle, and this file is the only half that
 * touches Firestore.
 */

export const PROFILE_TAG = "profile";
export const SETTINGS_COLLECTION = "settings";
export const PROFILE_DOC = "profile";

async function readProfile(): Promise<Profile> {
  if (!isAdminConfigured()) return DEFAULT_PROFILE;

  try {
    const snapshot = await adminDb().collection(SETTINGS_COLLECTION).doc(PROFILE_DOC).get();
    return snapshot.exists ? normaliseProfile(snapshot.data()) : DEFAULT_PROFILE;
  } catch (error) {
    // Load-bearing: a Firestore outage must not take the site down, so it
    // falls back to the copy compiled into the repo.
    console.error("[profile] Firestore read failed, using defaults:", error);
    return DEFAULT_PROFILE;
  }
}

export const getProfile = unstable_cache(readProfile, ["profile"], {
  tags: [PROFILE_TAG],
  revalidate: 3600,
});

/** Uncached, for the admin form which must show the last save. */
export async function getProfileFresh(): Promise<Profile> {
  return readProfile();
}
