import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // `/dev` is the glass harness; `/admin` and its API are private.
      disallow: ["/admin", "/api/", "/en/dev", "/id/dev"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
