import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <PlannerProvider>{children}</PlannerProvider>
      </body>
    </html>
  );
}
