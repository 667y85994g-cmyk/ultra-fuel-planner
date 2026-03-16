import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planner",
  description:
    "Build a terrain-aware fuelling plan for your trail or ultra running race. Upload your GPX, add your fuel inventory, and generate a schedule in minutes.",
  alternates: {
    canonical: "https://ultrafuelplanner.com/planner",
  },
};

export default function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
