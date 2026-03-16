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
  title: "Ultra Fuel Planner",
  description:
    "Route-aware fuelling plans for ultramarathons. Upload your GPX, add your fuel, get a practical race-day nutrition plan.",
  keywords: ["ultramarathon", "fuelling", "nutrition", "race plan", "GPX", "endurance"],
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
