"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { adminDb, getAdminUser } from "@/lib/firebase/admin";
import { TRIPS_COLLECTION, TRIPS_DOC, TRIPS_TAG, getTripsFresh } from "@/lib/content/trips";
import { trips as staticTrips, type Trip } from "@/content/site";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

/** Server Actions are public POST endpoints — re-check auth in every one. */
async function requireAdmin(): Promise<{ email: string } | null> {
  const user = await getAdminUser();
  if (!user?.email) return null;
  return { email: user.email };
}

function tripsDoc() {
  return adminDb().collection(TRIPS_COLLECTION).doc(TRIPS_DOC);
}

function revalidateTrips() {
  revalidateTag(TRIPS_TAG, "max");
  revalidatePath("/");
  revalidatePath("/travel/[slug]", "page");
}

async function write(items: Trip[], email: string) {
  await tripsDoc().set({ items, updatedAt: new Date().toISOString(), updatedBy: email });
  revalidateTrips();
}

/** Split a textarea into trimmed, non-empty lines. */
function toLines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Parse the itinerary editor.
 *
 * One day per line, pipe-separated: `Day 1-3 | Acclimatise | Walk, drink water…`
 * A plain textarea beats a nested repeater UI here — it's faster to edit and
 * trivially copy-pasteable between trips.
 */
function parseItinerary(value: FormDataEntryValue | null): Trip["itinerary"] {
  return toLines(value).map((line) => {
    const [day = "", title = "", ...rest] = line.split("|").map((part) => part.trim());
    return { day, title, detail: rest.join(" | ") };
  });
}

export async function seedTrips(): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    const snapshot = await tripsDoc().get();
    if (snapshot.exists) return { ok: false, error: "Firestore already has a trips document." };

    await write([...staticTrips], admin.email);
    return { ok: true, message: `Seeded ${staticTrips.length} trips.` };
  } catch (error) {
    console.error("[seedTrips]", error);
    return { ok: false, error: "Could not write to Firestore." };
  }
}

/** Create a blank trip, ready to edit. */
export async function createTrip(): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    const current = await getTripsFresh();
    const stamp = Date.now().toString(36);

    const trip: Trip = {
      id: `tr-${stamp}`,
      slug: `new-trip-${stamp}`,
      destination: "New trip",
      region: "",
      lat: 0,
      lng: 0,
      year: String(new Date().getFullYear()),
      days: 1,
      distanceKm: 0,
      budget: "",
      vibe: "",
      gradient: "from-orange-500/40 to-orange-700/20",
      hook: "",
      reflection: "",
      itinerary: [],
      gear: [],
      tips: [],
    };

    await write([trip, ...current], admin.email);
    return { ok: true, message: "Created a blank trip — open it to fill in the details." };
  } catch (error) {
    console.error("[createTrip]", error);
    return { ok: false, error: "Could not create." };
  }
}

export async function saveTrip(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing trip id." };

  const slug = String(formData.get("slug") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim();

  if (destination.length < 2) return { ok: false, error: "Destination is too short." };
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { ok: false, error: "Slug must be lowercase letters, numbers and hyphens only." };
  }

  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));

  // Out-of-range coordinates would place the globe pin somewhere impossible.
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { ok: false, error: "Latitude must be between -90 and 90." };
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { ok: false, error: "Longitude must be between -180 and 180." };
  }

  try {
    const current = await getTripsFresh();

    if (current.some((t) => t.slug === slug && t.id !== id)) {
      return { ok: false, error: `Another trip already uses the slug "${slug}".` };
    }

    const index = current.findIndex((t) => t.id === id);
    if (index === -1) return { ok: false, error: "That trip no longer exists." };

    const items = [...current];
    items[index] = {
      ...current[index],
      slug,
      destination,
      region: String(formData.get("region") ?? "").trim(),
      lat,
      lng,
      year: String(formData.get("year") ?? "").trim(),
      days: Math.max(0, Number(formData.get("days")) || 0),
      distanceKm: Math.max(0, Number(formData.get("distanceKm")) || 0),
      budget: String(formData.get("budget") ?? "").trim(),
      vibe: String(formData.get("vibe") ?? "").trim(),
      hook: String(formData.get("hook") ?? "").trim(),
      reflection: String(formData.get("reflection") ?? "").trim(),
      itinerary: parseItinerary(formData.get("itinerary")),
      gear: toLines(formData.get("gear")),
      tips: toLines(formData.get("tips")),
    };

    await write(items, admin.email);
    return { ok: true, message: `Saved “${destination}”.` };
  } catch (error) {
    console.error("[saveTrip]", error);
    return { ok: false, error: "Could not save. Check the server logs." };
  }
}

export async function deleteTrip(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    const current = await getTripsFresh();
    const remaining = current.filter((t) => t.id !== id);
    if (remaining.length === current.length) {
      return { ok: false, error: "That trip no longer exists." };
    }

    await write(remaining, admin.email);
    return { ok: true, message: "Trip deleted." };
  } catch (error) {
    console.error("[deleteTrip]", error);
    return { ok: false, error: "Could not delete." };
  }
}

export async function moveTrip(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    const items = [...(await getTripsFresh())];
    const index = items.findIndex((t) => t.id === id);
    if (index === -1) return { ok: false, error: "That trip no longer exists." };

    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return { ok: true, message: "Already at the end." };

    [items[index], items[target]] = [items[target], items[index]];
    await write(items, admin.email);
    return { ok: true, message: "Reordered." };
  } catch (error) {
    console.error("[moveTrip]", error);
    return { ok: false, error: "Could not reorder." };
  }
}
