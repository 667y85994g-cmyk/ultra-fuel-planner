"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mountain, ChevronLeft, Printer } from "lucide-react";
import { usePlanner } from "@/lib/planner-store";
import { Button } from "@/components/ui/button";
import { SummaryView } from "@/components/results/SummaryView";
import { TimelineView } from "@/components/results/TimelineView";
import { SegmentView } from "@/components/results/SegmentView";
import { CarryView } from "@/components/results/CarryView";
import { cn } from "@/lib/utils";
import { LegalFooter } from "@/components/LegalFooter";

const RouteMapView = dynamic(
  () => import("@/components/results/RouteMapView").then((m) => ({ default: m.RouteMapView })),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center h-64 text-stone-500 text-sm">Loading map…</div>
  )}
);

const TABS = [
  { id: "summary", label: "Summary" },
  { id: "timeline", label: "Timeline" },
  { id: "segments", label: "Segments" },
  { id: "carry", label: "Carry Plan" },
  { id: "map", label: "Map" },
];

export default function ResultsPage() {
  const router = useRouter();
  const { state } = usePlanner();
  const [activeTab, setActiveTab] = useState("summary");

  const output = state.lastPlannerOutput;

  useEffect(() => {
    if (!output) {
      router.push("/planner");
    }
  }, [output, router]);

  if (!output) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950">
        <div className="text-stone-400">Redirecting to planner...</div>
      </div>
    );
  }

  const handlePrint = () => {
    window.open("/print", "_blank");
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-stone-800/60 bg-stone-950/90 backdrop-blur-sm no-print">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-stone-400 hover:text-stone-200">
              <Mountain className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium hidden sm:inline">Ultra Fuel Planner</span>
              <span className="text-[10px] text-stone-600 hidden sm:inline">v2.0</span>
            </Link>
            <span className="text-stone-700">/</span>
            <span className="text-sm text-stone-300 font-medium">
              {output.eventPlan.eventName || "Race Plan"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/planner">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
                Edit plan
              </Button>
            </Link>
            <Button size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </nav>

      {/* Warnings */}
      {output.warnings.length > 0 && (
        <div className="border-b border-stone-800 bg-amber-950/30">
          <div className="mx-auto max-w-6xl px-6 py-3">
            <div className="flex flex-wrap gap-3">
              {output.warnings.map((w, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs ${
                    w.type === "error"
                      ? "bg-red-900/30 text-red-300"
                      : w.type === "warning"
                      ? "bg-amber-900/30 text-amber-300"
                      : "bg-stone-800/60 text-stone-400"
                  }`}
                >
                  <span>{w.type === "error" ? "⛔" : w.type === "warning" ? "⚠️" : "ℹ️"}</span>
                  <span>{w.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab nav */}
      <div className="border-b border-stone-800 bg-stone-950 no-print">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex gap-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-3.5 text-sm font-medium transition-colors border-b-2",
                  activeTab === tab.id
                    ? "border-amber-600 text-amber-400"
                    : "border-transparent text-stone-500 hover:text-stone-300"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="animate-fade-in">
          {activeTab === "summary" && <SummaryView output={output} />}
          {activeTab === "timeline" && <TimelineView output={output} raceStartTime={state.raceStartTime} />}
          {activeTab === "segments" && <SegmentView output={output} />}
          {activeTab === "carry" && <CarryView output={output} />}
          {activeTab === "map" && <RouteMapView output={output} />}
        </div>
      </main>

      <div className="no-print">
        <LegalFooter compact />
      </div>
    </div>
  );
}
