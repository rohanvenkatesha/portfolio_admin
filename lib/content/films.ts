import "server-only";

import { unstable_cache } from "next/cache";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { films as staticFilms, type Film } from "@/content/site";

export const FILMS_TAG = "films";
export const FILMS_COLLECTION = "content";
export const FILMS_DOC = "films";

type FilmsDoc = { items: Film[]; updatedAt?: string };

function normalise(raw: unknown): Film | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as Partial<Film>;
  if (!f.id) return null;

  return {
    id: String(f.id),
    title: String(f.title ?? "Untitled"),
    role: String(f.role ?? ""),
    year: String(f.year ?? ""),
    runtime: String(f.runtime ?? ""),
    synopsis: String(f.synopsis ?? ""),
    gradient: String(f.gradient ?? "from-orange-500/40 via-zinc-800 to-zinc-950"),
    ...(f.embedUrl ? { embedUrl: String(f.embedUrl) } : {}),
  };
}

async function readFilms(): Promise<Film[]> {
  if (!isAdminConfigured()) return staticFilms;

  try {
    const snapshot = await adminDb().collection(FILMS_COLLECTION).doc(FILMS_DOC).get();
    if (!snapshot.exists) return staticFilms;

    const data = snapshot.data() as FilmsDoc | undefined;
    if (data?.items === undefined) return staticFilms;

    return data.items.map(normalise).filter((f): f is Film => f !== null);
  } catch (error) {
    console.error("[films] Firestore read failed, serving repo content:", error);
    return staticFilms;
  }
}

export const getFilms = unstable_cache(readFilms, ["films-list"], {
  tags: [FILMS_TAG],
  revalidate: 3600,
});

export async function getFilmsFresh(): Promise<Film[]> {
  return readFilms();
}

export async function isFilmsSeeded(): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  try {
    const snapshot = await adminDb().collection(FILMS_COLLECTION).doc(FILMS_DOC).get();
    return snapshot.exists && (snapshot.data() as FilmsDoc | undefined)?.items !== undefined;
  } catch {
    return false;
  }
}
