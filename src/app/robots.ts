export const dynamic = "force-static";

import type { MetadataRoute } from "next";

// The admin dashboard must never be indexed or listed in the sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: ["/admin", "/api/admin"] }],
  };
}
