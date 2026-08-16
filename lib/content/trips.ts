import "server-only";

import { unstable_cache } from "next/cache";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { isValidMediaPath } from "@/lib/content/media";
import { trips as staticTrips, type Trip } from "@/content/site";

export const TRIPS_TAG = "trips";
export const TRIPS_COLLECTION = "content";
export const TRIPS_DOC = "trips";

type TripsDoc = { items: Trip[]; updatedAt?: string };

const asStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String).filter(Boolean) : [];

/** Drop unknown keys and coerce types, so a bad write can't reach the UI. */
function normalise(raw: unknown): Trip | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Partial<Trip>;
  if (!t.id || !t.slug || !t.destination) return null;

  const itinerary = Array.isArray(t.itinerary)
    ? t.itinerary
        .map((day) => ({
          day: String((day as Trip["itinerary"][number])?.day ?? ""),
          title: String((day as Trip["itinerary"][number])?.title ?? ""),
          detail: String((day as Trip["itinerary"][number])?.detail ?? ""),
        }))
        .filter((day) => day.day || day.title)
    : [];

  return {
    id: String(t.id),
    slug: String(t.slug),
    destination: String(t.destination),
    region: String(t.region ?? ""),
    // Coordinates drive real pin placement on the globe — a bad value would
    // put a marker in the sea, so fall back to 0,0 rather than NaN.
    lat: Number.isFinite(Number(t.lat)) ? Number(t.lat) : 0,
    lng: Number.isFinite(Number(t.lng)) ? Number(t.lng) : 0,
    year: String(t.year ?? ""),
    days: Number.isFinite(Number(t.days)) ? Number(t.days) : 0,
    distanceKm: Number.isFinite(Number(t.distanceKm)) ? Number(t.distanceKm) : 0,
    budget: String(t.budget ?? ""),
    vibe: String(t.vibe ?? ""),
    gradient: String(t.gradient ?? "from-orange-500/40 to-orange-700/20"),
    // Only a path under /media is accepted — see isValidMediaPath. Anything
    // else (an absolute URL, a traversal attempt) is dropped, and the trip
    // falls back to its gradient rather than rendering a broken image.
    coverUrl: typeof t.coverUrl === "string" && isValidMediaPath(t.coverUrl) ? t.coverUrl : undefined,
    hook: String(t.hook ?? ""),
    reflection: String(t.reflection ?? ""),
    itinerary,
    gear: asStringList(t.gear),
    tips: asStringList(t.tips),
    // Only carried when set: an always-present `deletedAt: undefined` would
    // make every trip look like it had been through the trash.
    ...(typeof t.deletedAt === "string" && t.deletedAt ? { deletedAt: t.deletedAt } : {}),
  };
}

/**
 * Read trips from Firestore, falling back to the checked-in content.
 *
 * An explicitly empty array is respected — it means "I deleted the
 * placeholders" — while a missing document means "not seeded yet".
 */
async function readTrips(): Promise<Trip[]> {
  if (!isAdminConfigured()) return staticTrips;

  try {
    const snapshot = await adminDb().collection(TRIPS_COLLECTION).doc(TRIPS_DOC).get();
    if (!snapshot.exists) return staticTrips;

    const data = snapshot.data() as TripsDoc | undefined;
    if (data?.items === undefined) return staticTrips;

    return data.items.map(normalise).filter((t): t is Trip => t !== null);
  } catch (error) {
    console.error("[trips] Firestore read failed, serving repo content:", error);
    return staticTrips;
  }
}

const readAllTrips = unstable_cache(readTrips, ["trips-list"], {
  tags: [TRIPS_TAG],
  revalidate: 3600,
});

/**
 * Live trips — what the public site sees.
 *
 * Trashed trips are filtered here rather than at each call site, so a new
 * listing can't accidentally surface one. Only `getTrashedTrips` sees them.
 */
export async function getTrips(): Promise<Trip[]> {
  return (await readAllTrips()).filter((trip) => !trip.deletedAt);
}

/** Trashed trips, newest first. For the trash screen only. */
export async function getTrashedTrips(): Promise<Trip[]> {
  return (await readTrips())
    .filter((trip) => trip.deletedAt)
    .sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? ""));
}

/** Everything, trashed included — for actions that must see the whole set. */
export async function getAllTripsRaw(): Promise<Trip[]> {
  return readTrips();
}

export async function getTripsFresh(): Promise<Trip[]> {
  return (await readTrips()).filter((trip) => !trip.deletedAt);
}

export async function isTripsSeeded(): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  try {
    const snapshot = await adminDb().collection(TRIPS_COLLECTION).doc(TRIPS_DOC).get();
    return snapshot.exists && (snapshot.data() as TripsDoc | undefined)?.items !== undefined;
  } catch {
    return false;
  }
}
