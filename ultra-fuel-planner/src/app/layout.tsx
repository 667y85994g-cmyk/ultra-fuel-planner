import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { PlannerProvider } from "@/lib/planner-store";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#0c0c0c",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://ultrafuelplanner.com"),
  title: {
    template: "%s | Ultra Fuel Planner",
    default:
      "Ultra Fuel Planner | Terrain-Aware Fuelling Strategy for Trail & Ultra Runners",
  },
  description:
    "Upload a GPX route and generate a terrain-aware fuelling strategy for trail and ultra running races. Plan carb intake, carry strategy, and section-based nutrition guidance for endurance events.",
  keywords: [
    "ultramarathon fuelling plan",
    "ultra running nutrition strategy",
    "trail running fuelling calculator",
    "ultra race fuelling planner",
    "carbs per hour ultramarathon",
    "trail race fuelling strategy",
    "GPX route nutrition plan",
    "endurance fuelling",
  ],
  authors: [{ name: "Ultra Fuel Planner" }],
  creator: "Ultra Fuel Planner",
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://ultrafuelplanner.com",
    siteName: "Ultra Fuel Planner",
    title: "Ultra Fuel Planner",
    description:
      "Terrain-aware fuelling plans for trail and ultra running races.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Ultra Fuel Planner — Terrain-aware fuelling strategy for trail and ultra runners",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ultra Fuel Planner",
    description:
      "Terrain-aware fuelling plans for trail and ultra running races.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: "https://ultrafuelplanner.com",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ultra Fuel Planner",
  },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <PlannerProvider>{children}</PlannerProvider>

        {/* ── Google Analytics 4 ── loaded after interaction so it never
            blocks paint. Guards on GA_ID so dev builds stay clean. */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { send_page_view: true });
            `}</Script>
          </>
        )}
      </body>
    </html>
  );
}
