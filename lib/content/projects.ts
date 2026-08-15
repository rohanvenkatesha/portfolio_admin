import "server-only";

import { unstable_cache } from "next/cache";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { projects as staticProjects, type Project } from "@/content/site";

export const PROJECTS_TAG = "projects";
export const PROJECTS_COLLECTION = "content";
export const PROJECTS_DOC = "projects";

/**
 * Firestore stores the collection as a single document holding an ordered
 * array, rather than one document per project.
 *
 * Nineteen small records is far below the 1MB document limit, and this way a
 * read is one round trip and ordering is explicit rather than depending on a
 * sort field. If the collection ever grows past a few hundred entries, this is
 * the thing to split up.
 */
type ProjectsDoc = { items: Project[]; updatedAt?: string };

/** Drop unknown keys and coerce types, so a bad write can't reach the UI. */
function normalise(raw: unknown): Project | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<Project>;

  if (!p.id || !p.slug || !p.title) return null;

  return {
    id: String(p.id),
    slug: String(p.slug),
    title: String(p.title),
    blurb: String(p.blurb ?? ""),
    category: (p.category ?? "AI & ML") as Project["category"],
    stack: Array.isArray(p.stack) ? p.stack.map(String) : [],
    highlights: Array.isArray(p.highlights) ? p.highlights.map(String) : [],
    accent: (p.accent ?? "cyan") as Project["accent"],
    ...(p.coverUrl ? { coverUrl: String(p.coverUrl) } : {}),
    ...(p.featured === true ? { featured: true } : {}),
    ...(p.repo ? { repo: String(p.repo) } : {}),
    ...(p.demo ? { demo: String(p.demo) } : {}),
    ...(p.year ? { year: String(p.year) } : {}),
    ...(p.status ? { status: p.status as Project["status"] } : {}),
    ...(Array.isArray(p.metrics) ? { metrics: p.metrics } : {}),
    ...(p.architecture ? { architecture: String(p.architecture) } : {}),
  };
}

/**
 * Read projects from Firestore, falling back to the checked-in content.
 *
 * The fallback is deliberate and load-bearing: if Firebase is unconfigured,
 * unreachable, or simply hasn't been seeded, the site still builds and renders
 * with the content in the repo. A CMS outage should never take down a
 * portfolio.
 */
async function readProjects(): Promise<Project[]> {
  if (!isAdminConfigured()) return staticProjects;

  try {
    const snapshot = await adminDb()
      .collection(PROJECTS_COLLECTION)
      .doc(PROJECTS_DOC)
      .get();

    if (!snapshot.exists) return staticProjects;

    const data = snapshot.data() as ProjectsDoc | undefined;
    const items = (data?.items ?? []).map(normalise).filter((p): p is Project => p !== null);

    // An empty or entirely invalid document means "not seeded yet".
    return items.length > 0 ? items : staticProjects;
  } catch (error) {
    console.error("[projects] Firestore read failed, serving repo content:", error);
    return staticProjects;
  }
}

/**
 * Cached read, tagged so an admin save can invalidate it on demand via
 * revalidateTag(PROJECTS_TAG). Pages stay static between writes.
 */
export const getProjects = unstable_cache(readProjects, ["projects-list"], {
  tags: [PROJECTS_TAG],
  revalidate: 3600,
});

export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  const all = await getProjects();
  return all.find((project) => project.slug === slug);
}

/** Uncached read, for admin screens that must show what was just saved. */
export async function getProjectsFresh(): Promise<Project[]> {
  return readProjects();
}

/** True when Firestore is actually backing the content. */
export async function isProjectsSeeded(): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  try {
    const snapshot = await adminDb()
      .collection(PROJECTS_COLLECTION)
      .doc(PROJECTS_DOC)
      .get();
    const data = snapshot.data() as ProjectsDoc | undefined;
    return Boolean(snapshot.exists && (data?.items?.length ?? 0) > 0);
  } catch {
    return false;
  }
}
