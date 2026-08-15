import "server-only";

import { unstable_cache } from "next/cache";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { DEFAULT_THEME, normaliseTheme, type Theme } from "@/content/theme";

/**
 * Server-side theme access.
 *
 * The shape, defaults, presets and validation live in content/theme.ts so the
 * admin editor can import them without dragging firebase-admin into the client
 * bundle. This file is the only half that touches Firestore.
 */

export const THEME_TAG = "theme";
export const SETTINGS_COLLECTION = "settings";
export const THEME_DOC = "theme";

async function readTheme(): Promise<Theme> {
  if (!isAdminConfigured()) return DEFAULT_THEME;

  try {
    const snapshot = await adminDb().collection(SETTINGS_COLLECTION).doc(THEME_DOC).get();
    return snapshot.exists ? normaliseTheme(snapshot.data()) : DEFAULT_THEME;
  } catch (error) {
    console.error("[theme] Firestore read failed, using defaults:", error);
    return DEFAULT_THEME;
  }
}

export const getTheme = unstable_cache(readTheme, ["theme"], {
  tags: [THEME_TAG],
  revalidate: 3600,
});

/** Uncached, for the admin editor which must show the last save. */
export async function getThemeFresh(): Promise<Theme> {
  return readTheme();
}
