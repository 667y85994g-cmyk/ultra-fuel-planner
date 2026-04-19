import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ultra Fuel Planner",
    short_name: "UFP",
    description: "Route-aware fuelling for ultra-distance runners.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4efe6", // paper
    theme_color: "#f4efe6",      // paper — chrome should recede
    icons: [
      {
        src: "/android-chrome-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/android-chrome-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
