import type { MetadataRoute } from "next";
import { getProjects } from "@/lib/content/projects";
import { getTrips } from "@/lib/content/trips";

/**
 * Set NEXT_PUBLIC_SITE_URL to your deployed origin (e.g. https://rohan.dev)
 * so the sitemap emits absolute URLs. The fallback keeps local builds valid.
 */
export const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [projects, trips] = await Promise.all([getProjects(), getTrips()]);

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
    ...trips.map((trip) => ({
      url: `${BASE_URL}/travel/${trip.slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
