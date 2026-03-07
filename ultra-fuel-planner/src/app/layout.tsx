import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlannerProvider } from "@/lib/planner-store";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Ultra Fuel Planner",
  description:
    "Route-aware fuelling plans for ultramarathons. Upload your GPX, add your fuel, get a practical race-day nutrition plan.",
  keywords: ["ultramarathon", "fuelling", "nutrition", "race plan", "GPX", "endurance"],
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
