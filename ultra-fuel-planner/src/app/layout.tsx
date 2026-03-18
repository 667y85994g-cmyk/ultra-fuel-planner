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
      "Ultra Fuel Planner | Build a Fuelling Plan for Your Ultra Marathon",
  },
  description:
    "Build a practical fuelling plan for your ultra. Upload your route, use data from your runs, and know exactly what to eat and when on race day.",
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
    title: "Ultra Fuel Planner | Build a Fuelling Plan for Your Ultra Marathon",
    description:
      "Build a practical fuelling plan for your ultra. Upload your route, use data from your runs, and know exactly what to eat and when on race day.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Ultra Fuel Planner — Build a fuelling plan for your ultra marathon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ultra Fuel Planner | Build a Fuelling Plan for Your Ultra Marathon",
    description:
      "Build a practical fuelling plan for your ultra. Upload your route, use data from your runs, and know exactly what to eat and when on race day.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: "https://ultrafuelplanner.com",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon", sizes: "48x48" },
      { url: "/icon", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon",
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
        {/* WebSite structured data — tells Google to show "Ultra Fuel Planner"
            as the site name in search results instead of the raw domain. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Ultra Fuel Planner",
              url: "https://ultrafuelplanner.com",
            }),
          }}
        />
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
