import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // API routes are not for crawling. Results and print pages are
        // user-generated ephemeral state — no indexable content.
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://ultrafuelplanner.com/sitemap.xml",
  };
}
