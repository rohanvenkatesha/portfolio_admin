import "server-only";

import { unstable_cache } from "next/cache";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { DEFAULT_TIMELINE, normaliseTimeline, type TimelineEntry } from "@/content/timeline";

/**
 * Server-side access to the Journey timeline.
 *
 * Stored as `{ items: [...] }` under settings, matching how trips and projects
 * hold their lists, so the document shape is the same everywhere.
 */

export const TIMELINE_TAG = "timeline";
export const SETTINGS_COLLECTION = "settings";
export const TIMELINE_DOC = "timeline";

type TimelineDoc = { items: TimelineEntry[] };

async function readTimeline(): Promise<TimelineEntry[]> {
  if (!isAdminConfigured()) return DEFAULT_TIMELINE;

  try {
    const snapshot = await adminDb().collection(SETTINGS_COLLECTION).doc(TIMELINE_DOC).get();
    if (!snapshot.exists) return DEFAULT_TIMELINE;

    const data = snapshot.data() as TimelineDoc | undefined;
    // An explicitly empty array is respected — it means "I cleared these" —
    // while a missing items field means the document was never seeded.
    if (!Array.isArray(data?.items)) return DEFAULT_TIMELINE;

    return normaliseTimeline(data.items);
  } catch (error) {
    // Load-bearing: a Firestore outage must not take the site down.
    console.error("[timeline] Firestore read failed, using defaults:", error);
    return DEFAULT_TIMELINE;
  }
}

export const getTimeline = unstable_cache(readTimeline, ["timeline"], {
  tags: [TIMELINE_TAG],
  revalidate: 3600,
});

/** Uncached, for the admin editor which must show the last save. */
export async function getTimelineFresh(): Promise<TimelineEntry[]> {
  return readTimeline();
}
