"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { adminDb, getAdminUser } from "@/lib/firebase/admin";
import { SETTINGS_COLLECTION, TIMELINE_DOC, TIMELINE_TAG } from "@/lib/content/timeline";
import {
  DEFAULT_TIMELINE,
  TIMELINE_KINDS,
  TIMELINE_TRACKS,
  normaliseTimeline,
  startYear,
  type TimelineEntry,
  type TimelineKind,
  type TimelineTrack,
} from "@/content/timeline";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

/** Server Actions are public POST endpoints — re-check auth in every one. */
async function requireAdmin(): Promise<{ email: string } | null> {
  const user = await getAdminUser();
  if (!user?.email) return null;
  return { email: user.email };
}

async function write(items: TimelineEntry[], email: string) {
  await adminDb()
    .collection(SETTINGS_COLLECTION)
    .doc(TIMELINE_DOC)
    .set({ items, updatedAt: new Date().toISOString(), updatedBy: email });

  revalidateTag(TIMELINE_TAG, "max");
  revalidatePath("/", "layout");
}

/** Split a textarea into trimmed, non-empty lines. */
function toLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function saveTimeline(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  /**
   * Entries arrive as parallel arrays of same-named inputs, which is what a
   * plain form produces from repeated fields. DOM order is the stored order, so
   * moving a row in the editor is the whole of reordering.
   */
  const all = (key: string) => formData.getAll(key).map(String);

  const ids = all("tlId");
  const tracks = all("tlTrack");
  const kinds = all("tlKind");
  const periods = all("tlPeriod");
  const titles = all("tlTitle");
  const orgs = all("tlOrg");
  const locations = all("tlLocation");
  const summaries = all("tlSummary");
  const highlights = all("tlHighlights");
  const stacks = all("tlStack");

  const items = normaliseTimeline(
    titles.map((title, i) => ({
      id: ids[i] ?? "",
      track: (TIMELINE_TRACKS.includes(tracks[i] as TimelineTrack)
        ? tracks[i]
        : "tech") as TimelineTrack,
      kind: (TIMELINE_KINDS.includes(kinds[i] as TimelineKind) ? kinds[i] : "work") as TimelineKind,
      period: periods[i] ?? "",
      title,
      org: orgs[i] ?? "",
      location: locations[i] ?? "",
      summary: summaries[i] ?? "",
      highlights: toLines(highlights[i] ?? ""),
      // Comma-separated, the way a stack is typed rather than stored.
      stack: (stacks[i] ?? "")
        .split(",")
        .map((tech) => tech.trim())
        .filter(Boolean),
    }))
  );

  /**
   * A period with no four-digit year in it leaves the card's oversized numeral
   * blank and sorts to the bottom of the blended view. That's a silent, ugly
   * failure, so it's caught here with the offending entry named.
   */
  const undated = items.filter((entry) => !startYear(entry.period));
  if (undated.length) {
    return {
      ok: false,
      error: `Add a year to the period for: ${undated.map((e) => `“${e.title}”`).join(", ")}.`,
    };
  }

  try {
    await write(items, admin.email);
    return { ok: true, message: `Saved ${items.length} entries.` };
  } catch (error) {
    console.error("[saveTimeline]", error);
    return { ok: false, error: "Could not save. Check the server logs." };
  }
}

export async function resetTimeline(): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    await write(DEFAULT_TIMELINE, admin.email);
    return { ok: true, message: "Reset to the timeline in the repo." };
  } catch (error) {
    console.error("[resetTimeline]", error);
    return { ok: false, error: "Could not reset." };
  }
}
