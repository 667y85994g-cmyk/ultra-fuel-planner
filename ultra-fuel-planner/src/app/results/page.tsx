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
              <span className="text-[10px] text-stone-600 hidden sm:inline">v2.18</span>
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

      {/* Plan notes — only surface genuinely useful contextual alerts.
          Suppress noisy diagnostics (CARB_TARGET_SET, KCAL_CONTEXT, RACE_STRATEGY,
          LOW_CONFIDENCE, SANITY_*, STOCK_SHORTFALL) from the main user path. */}
      {(() => {
        const SHOWN_INFO_CODES = new Set(["HEAT_FLUID_ADJUSTED", "CARB_TARGET_CAPPED"]);
        const shownInfo = output.warnings.filter(
          w => w.type === "info" && w.code && SHOWN_INFO_CODES.has(w.code)
        );
        const errors = output.warnings.filter(w => w.type === "error");

        // Group NO_SUITABLE_FUEL errors so repeated instances show once
        const groupMap = new Map<string, { w: typeof errors[0]; count: number }>();
        const groupOrder: string[] = [];
        for (const w of errors) {
          const key = w.code ?? w.message;
          if (groupMap.has(key)) { groupMap.get(key)!.count++; }
          else { groupMap.set(key, { w, count: 1 }); groupOrder.push(key); }
        }
        const groupedErrors = groupOrder.map(key => {
          const { w, count } = groupMap.get(key)!;
          if (count === 1) return w;
          if (w.code === "NO_SUITABLE_FUEL") {
            return { ...w, message: `No suitable fuel at ${count} schedule points — add gels or other discrete fuels to your inventory.` };
          }
          return { ...w, message: `${w.message} (×${count})` };
        });

        if (shownInfo.length === 0 && groupedErrors.length === 0) return null;

        return (
          <div className={`border-b ${groupedErrors.length > 0 ? "border-stone-800 bg-amber-950/20" : "border-stone-800/50"}`}>
            <div className="mx-auto max-w-6xl px-6 py-2.5">
              <div className="flex flex-wrap gap-2">
                {shownInfo.map((w, i) => (
                  <div key={`info-${i}`} className="flex items-start gap-1.5 rounded px-2.5 py-1.5 text-xs bg-stone-800/40 text-stone-400">
                    <span className="shrink-0 mt-px">ℹ️</span>
                    <span>{w.message}</span>
                  </div>
                ))}
                {groupedErrors.map((w, i) => (
                  <div key={`err-${i}`} className="flex items-start gap-1.5 rounded px-2.5 py-1.5 text-xs bg-red-900/30 text-red-300">
                    <span className="shrink-0 mt-px">⛔</span>
                    <span>{w.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

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
