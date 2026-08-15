"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { adminDb, getAdminUser } from "@/lib/firebase/admin";
import {
  PHOTOS_COLLECTION,
  PHOTOS_DOC,
  PHOTOS_TAG,
  getPhotosFresh,
} from "@/lib/content/photos";
import { photos as staticPhotos, type Photo } from "@/content/site";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

/** Server Actions are public POST endpoints — re-check auth in every one. */
async function requireAdmin(): Promise<{ email: string } | null> {
  const user = await getAdminUser();
  if (!user?.email) return null;
  return { email: user.email };
}

function photosDoc() {
  return adminDb().collection(PHOTOS_COLLECTION).doc(PHOTOS_DOC);
}

function revalidatePhotos() {
  revalidateTag(PHOTOS_TAG, "max");
  revalidatePath("/");
}

async function writePhotos(items: Photo[], email: string) {
  await photosDoc().set({ items, updatedAt: new Date().toISOString(), updatedBy: email });
  revalidatePhotos();
}

/** Copy the placeholder gallery into Firestore so it becomes editable. */
export async function seedPhotos(): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    const snapshot = await photosDoc().get();
    if (snapshot.exists) {
      return { ok: false, error: "Firestore already has a photos document." };
    }

    await writePhotos([...staticPhotos], admin.email);
    return { ok: true, message: `Seeded ${staticPhotos.length} placeholder frames.` };
  } catch (error) {
    console.error("[seedPhotos]", error);
    return { ok: false, error: "Could not write to Firestore." };
  }
}

/**
 * Record an uploaded image.
 *
 * The file itself went browser → Storage directly; this only stores the
 * resulting URL and metadata. The URL is checked against the expected Firebase
 * hosts so a compromised client can't point the gallery at an arbitrary site.
 */
export async function addPhoto(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  const src = String(formData.get("src") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim() || "Untitled";

  let host: string;
  try {
    host = new URL(src).hostname;
  } catch {
    return { ok: false, error: "That image URL is not valid." };
  }

  if (!["firebasestorage.googleapis.com", "storage.googleapis.com"].includes(host)) {
    return { ok: false, error: "Images must be served from Firebase Storage." };
  }

  try {
    const current = await getPhotosFresh();

    const photo: Photo = {
      id: `ph-${Date.now().toString(36)}`,
      title,
      location: String(formData.get("location") ?? "").trim(),
      span: (String(formData.get("span") ?? "square") as Photo["span"]) ?? "square",
      gradient: "from-orange-600/40 via-zinc-800 to-slate-900",
      src,
      exif: {
        camera: String(formData.get("camera") ?? "").trim(),
        lens: String(formData.get("lens") ?? "").trim(),
        iso: String(formData.get("iso") ?? "").trim(),
        aperture: String(formData.get("aperture") ?? "").trim(),
        shutter: String(formData.get("shutter") ?? "").trim(),
        focal: String(formData.get("focal") ?? "").trim(),
      },
    };

    await writePhotos([photo, ...current], admin.email);
    return { ok: true, message: `Added “${photo.title}”.` };
  } catch (error) {
    console.error("[addPhoto]", error);
    return { ok: false, error: "Could not save the photo." };
  }
}

/** Update the text fields of an existing frame. */
export async function updatePhoto(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing photo id." };

  try {
    const current = await getPhotosFresh();
    const index = current.findIndex((p) => p.id === id);
    if (index === -1) return { ok: false, error: "That photo no longer exists." };

    const items = [...current];
    items[index] = {
      ...items[index],
      title: String(formData.get("title") ?? items[index].title).trim(),
      location: String(formData.get("location") ?? "").trim(),
      span: (String(formData.get("span") ?? items[index].span) as Photo["span"]),
      exif: {
        camera: String(formData.get("camera") ?? "").trim(),
        lens: String(formData.get("lens") ?? "").trim(),
        iso: String(formData.get("iso") ?? "").trim(),
        aperture: String(formData.get("aperture") ?? "").trim(),
        shutter: String(formData.get("shutter") ?? "").trim(),
        focal: String(formData.get("focal") ?? "").trim(),
      },
    };

    await writePhotos(items, admin.email);
    return { ok: true, message: "Saved." };
  } catch (error) {
    console.error("[updatePhoto]", error);
    return { ok: false, error: "Could not save." };
  }
}

/**
 * Remove a frame from the gallery.
 *
 * The Storage object is deliberately left in place — deleting the record is
 * reversible, deleting the original file is not.
 */
export async function deletePhoto(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    const current = await getPhotosFresh();
    const remaining = current.filter((p) => p.id !== id);
    if (remaining.length === current.length) {
      return { ok: false, error: "That photo no longer exists." };
    }

    await writePhotos(remaining, admin.email);
    return { ok: true, message: "Removed from the gallery. The uploaded file was kept." };
  } catch (error) {
    console.error("[deletePhoto]", error);
    return { ok: false, error: "Could not remove." };
  }
}

/** Move a frame up or down in the gallery order. */
export async function movePhoto(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    const items = [...(await getPhotosFresh())];
    const index = items.findIndex((p) => p.id === id);
    if (index === -1) return { ok: false, error: "That photo no longer exists." };

    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return { ok: true, message: "Already at the end." };

    [items[index], items[target]] = [items[target], items[index]];
    await writePhotos(items, admin.email);
    return { ok: true, message: "Reordered." };
  } catch (error) {
    console.error("[movePhoto]", error);
    return { ok: false, error: "Could not reorder." };
  }
}
