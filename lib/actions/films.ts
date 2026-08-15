"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { adminDb, getAdminUser } from "@/lib/firebase/admin";
import { FILMS_COLLECTION, FILMS_DOC, FILMS_TAG, getFilmsFresh } from "@/lib/content/films";
import { films as staticFilms, type Film } from "@/content/site";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

async function requireAdmin(): Promise<{ email: string } | null> {
  const user = await getAdminUser();
  if (!user?.email) return null;
  return { email: user.email };
}

function filmsDoc() {
  return adminDb().collection(FILMS_COLLECTION).doc(FILMS_DOC);
}

async function write(items: Film[], email: string) {
  await filmsDoc().set({ items, updatedAt: new Date().toISOString(), updatedBy: email });
  revalidateTag(FILMS_TAG, "max");
  revalidatePath("/");
}

/**
 * Accept a YouTube or Vimeo link in any of its usual shapes and return the
 * embeddable form. Pasting the URL from the address bar is the natural thing
 * to do, and that URL never works in an iframe.
 */
function toEmbedUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    }
    if (host.endsWith("youtube.com")) {
      if (url.pathname.startsWith("/embed/")) return url.toString();
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host.endsWith("vimeo.com")) {
      if (host.startsWith("player.")) return url.toString();
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function seedFilms(): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    const snapshot = await filmsDoc().get();
    if (snapshot.exists) return { ok: false, error: "Firestore already has a films document." };

    await write([...staticFilms], admin.email);
    return { ok: true, message: `Seeded ${staticFilms.length} films.` };
  } catch (error) {
    console.error("[seedFilms]", error);
    return { ok: false, error: "Could not write to Firestore." };
  }
}

export async function createFilm(): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    const current = await getFilmsFresh();
    const film: Film = {
      id: `f-${Date.now().toString(36)}`,
      title: "New film",
      role: "",
      year: String(new Date().getFullYear()),
      runtime: "",
      synopsis: "",
      gradient: "from-orange-500/40 via-zinc-800 to-zinc-950",
      embedUrl: "",
    };

    await write([film, ...current], admin.email);
    return { ok: true, message: "Created a blank film." };
  } catch (error) {
    console.error("[createFilm]", error);
    return { ok: false, error: "Could not create." };
  }
}

export async function saveFilm(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing film id." };

  const rawEmbed = String(formData.get("embedUrl") ?? "").trim();
  const embedUrl = rawEmbed ? toEmbedUrl(rawEmbed) : "";

  if (rawEmbed && embedUrl === null) {
    return {
      ok: false,
      error: "That doesn't look like a YouTube or Vimeo link. Paste the normal watch URL.",
    };
  }

  try {
    const current = await getFilmsFresh();
    const index = current.findIndex((f) => f.id === id);
    if (index === -1) return { ok: false, error: "That film no longer exists." };

    const items = [...current];
    items[index] = {
      ...items[index],
      title: String(formData.get("title") ?? "").trim() || "Untitled",
      role: String(formData.get("role") ?? "").trim(),
      year: String(formData.get("year") ?? "").trim(),
      runtime: String(formData.get("runtime") ?? "").trim(),
      synopsis: String(formData.get("synopsis") ?? "").trim(),
      embedUrl: embedUrl ?? "",
    };

    await write(items, admin.email);
    return {
      ok: true,
      message: embedUrl && embedUrl !== rawEmbed ? "Saved — link converted to embed form." : "Saved.",
    };
  } catch (error) {
    console.error("[saveFilm]", error);
    return { ok: false, error: "Could not save." };
  }
}

export async function deleteFilm(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    const current = await getFilmsFresh();
    const remaining = current.filter((f) => f.id !== id);
    if (remaining.length === current.length) {
      return { ok: false, error: "That film no longer exists." };
    }

    await write(remaining, admin.email);
    return { ok: true, message: "Film deleted." };
  } catch (error) {
    console.error("[deleteFilm]", error);
    return { ok: false, error: "Could not delete." };
  }
}
