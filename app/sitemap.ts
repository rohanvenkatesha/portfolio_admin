import type { MetadataRoute } from "next";
import { getProjects } from "@/lib/content/projects";
import { getTrips } from "@/lib/content/trips";
import { getPosts } from "@/lib/content/posts";

/**
 * Set NEXT_PUBLIC_SITE_URL to your deployed origin (e.g. https://rohan.dev)
 * so the sitemap emits absolute URLs. The fallback keeps local builds valid.
 */
export const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [projects, trips, posts] = await Promise.all([getProjects(), getTrips(), getPosts()]);

  return [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/travel`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/darkroom`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    ...projects.map((project) => ({
      url: `${BASE_URL}/work/${project.slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
    // Published posts only — getPosts already filters drafts out, so a draft
    // can't be discovered through the sitemap either.
    ...posts.flatMap((post) => {
      const trip = trips.find((t) => t.id === post.tripId);
      return trip
        ? [
            {
              url: `${BASE_URL}/travel/${trip.slug}/${post.slug}`,
              lastModified: post.date ? new Date(`${post.date}T00:00:00Z`) : now,
              changeFrequency: "yearly" as const,
              priority: 0.7,
            },
          ]
        : [];
    }),
    ...trips.map((trip) => ({
      url: `${BASE_URL}/travel/${trip.slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
