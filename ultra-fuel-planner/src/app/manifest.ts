import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ultra Fuel Planner",
    short_name: "UltraFuel",
    description:
      "Route-aware fuelling plans for ultramarathons. Upload your GPX, add your fuel, get a practical race-day nutrition plan.",
    start_url: "/",
    display: "standalone",
    background_color: "#1c0a00",
    theme_color: "#92400e",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
