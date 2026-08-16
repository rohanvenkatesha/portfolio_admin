import "server-only";

import { unstable_cache } from "next/cache";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { normalisePost, sortPosts, type TripPost } from "@/content/posts";

/**
 * Trip blog posts.
 *
 * One document holding every post, matching how trips and projects are stored.
 * Posts are read as a set and filtered in memory: the whole collection is a few
 * hundred kilobytes at the sizes this site will ever reach, and a single read
 * beats a query per trip.
 *
 * There is no repo fallback here, unlike trips or projects. Posts have never
 * existed in content/site.ts, so an empty result is the honest answer to "no
 * posts yet" rather than a sign something failed.
 */

export const POSTS_TAG = "posts";
export const POSTS_COLLECTION = "content";
export const POSTS_DOC = "posts";

type PostsDoc = { items: TripPost[]; updatedAt?: string };

async function readPosts(): Promise<TripPost[]> {
  if (!isAdminConfigured()) return [];

  try {
    const snapshot = await adminDb().collection(POSTS_COLLECTION).doc(POSTS_DOC).get();
    if (!snapshot.exists) return [];

    const data = snapshot.data() as PostsDoc | undefined;
    if (!Array.isArray(data?.items)) return [];

    return sortPosts(data.items.map(normalisePost).filter((post) => post.id && post.slug));
  } catch (error) {
    console.error("[posts] Firestore read failed:", error);
    return [];
  }
}

const readAll = unstable_cache(readPosts, ["posts"], {
  tags: [POSTS_TAG],
  revalidate: 3600,
});

/** Published posts only — everything the public site should ever see. */
export async function getPosts(): Promise<TripPost[]> {
  return (await readAll()).filter((post) => post.published);
}

/** Published posts for one trip. */
export async function getPostsForTrip(tripId: string): Promise<TripPost[]> {
  return (await getPosts()).filter((post) => post.tripId === tripId);
}

/**
 * One published post, matched by trip slug + post slug.
 *
 * Takes the trip id rather than resolving it here so the caller — which has
 * already loaded the trip to render it — doesn't pay for a second lookup.
 */
export async function getPost(tripId: string, slug: string): Promise<TripPost | undefined> {
  return (await getPosts()).find((post) => post.tripId === tripId && post.slug === slug);
}

/** Every post including drafts, uncached — for the admin only. */
export async function getPostsFresh(): Promise<TripPost[]> {
  return readPosts();
}
