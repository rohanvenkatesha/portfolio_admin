import "server-only";

import { unstable_cache } from "next/cache";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { photos as staticPhotos, type Photo } from "@/content/site";

export const PHOTOS_TAG = "photos";
export const PHOTOS_COLLECTION = "content";
export const PHOTOS_DOC = "photos";

type PhotosDoc = { items: Photo[]; updatedAt?: string };

const SPANS: Photo["span"][] = ["tall", "wide", "square"];

/** Drop unknown keys and coerce types, so a bad write can't reach the UI. */
function normalise(raw: unknown): Photo | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<Photo>;
  if (!p.id) return null;

  const exif = (p.exif ?? {}) as Partial<Photo["exif"]>;

  return {
    id: String(p.id),
    title: String(p.title ?? "Untitled"),
    location: String(p.location ?? ""),
    gradient: String(p.gradient ?? "from-orange-600/50 via-zinc-800 to-slate-900"),
    span: SPANS.includes(p.span as Photo["span"]) ? (p.span as Photo["span"]) : "square",
    exif: {
      camera: String(exif.camera ?? ""),
      lens: String(exif.lens ?? ""),
      iso: String(exif.iso ?? ""),
      aperture: String(exif.aperture ?? ""),
      shutter: String(exif.shutter ?? ""),
      focal: String(exif.focal ?? ""),
    },
    ...(p.src ? { src: String(p.src) } : {}),
  };
}

/**
 * Read photos from Firestore, falling back to the checked-in placeholders.
 *
 * Same load-bearing fallback as projects: an unseeded or unreachable Firestore
 * must never break the build or blank the gallery.
 */
async function readPhotos(): Promise<Photo[]> {
  if (!isAdminConfigured()) return staticPhotos;

  try {
    const snapshot = await adminDb().collection(PHOTOS_COLLECTION).doc(PHOTOS_DOC).get();
    if (!snapshot.exists) return staticPhotos;

    const data = snapshot.data() as PhotosDoc | undefined;
    const items = (data?.items ?? []).map(normalise).filter((p): p is Photo => p !== null);

    // An empty array is a legitimate state here — it means "I deleted the
    // placeholders and haven't uploaded yet" — so respect it rather than
    // resurrecting fake frames.
    return snapshot.exists && data?.items !== undefined ? items : staticPhotos;
  } catch (error) {
    console.error("[photos] Firestore read failed, serving repo content:", error);
    return staticPhotos;
  }
}

export const getPhotos = unstable_cache(readPhotos, ["photos-list"], {
  tags: [PHOTOS_TAG],
  revalidate: 3600,
});

/** Uncached read, for admin screens that must show what was just saved. */
export async function getPhotosFresh(): Promise<Photo[]> {
  return readPhotos();
}

/** True when Firestore is backing the gallery. */
export async function isPhotosSeeded(): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  try {
    const snapshot = await adminDb().collection(PHOTOS_COLLECTION).doc(PHOTOS_DOC).get();
    return snapshot.exists && (snapshot.data() as PhotosDoc | undefined)?.items !== undefined;
  } catch {
    return false;
  }
}
