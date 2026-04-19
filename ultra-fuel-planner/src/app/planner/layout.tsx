import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { PlannerStepBar } from "@/components/planner/PlannerStepBar";
import { LegalFooter } from "@/components/LegalFooter";

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
  return (
    <>
      <SiteNav showPlannerLink={false} />
      <PlannerStepBar />
      <main className="min-h-screen bg-paper text-ink">
        {children}
      </main>
      <LegalFooter compact />
    </>
  );
}
