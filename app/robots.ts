import type { MetadataRoute } from "next";
import { BASE_URL } from "./sitemap";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Admin is auth-gated anyway; this keeps it out of search results.
      disallow: ["/admin", "/api"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
