"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Download, ThumbsUp, ThumbsDown } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { usePlanner } from "@/lib/planner-store";
import { Button } from "@/components/ui/button";
import { SummaryView } from "@/components/results/SummaryView";
import { TimelineView } from "@/components/results/TimelineView";
import { SegmentView } from "@/components/results/SegmentView";
import { CarryView } from "@/components/results/CarryView";
import { cn } from "@/lib/utils";
import { LegalFooter } from "@/components/LegalFooter";
import { trackPlanFeedback, trackSurveyShown } from "@/lib/analytics";
import { SurveyModal, SURVEY_STORAGE_KEY } from "@/components/SurveyModal";

const RouteMapView = dynamic(
  () => import("@/components/results/RouteMapView").then((m) => ({ default: m.RouteMapView })),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center h-64 text-ink-3 text-sm">Loading map…</div>
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
  const [feedback, setFeedback] = useState<"pending" | "positive" | "negative">("pending");
  const [showSurvey, setShowSurvey] = useState(false);

  const handleFeedback = (helpful: boolean) => {
    trackPlanFeedback(helpful);
    setFeedback(helpful ? "positive" : "negative");
  };

  const output = state.lastPlannerOutput;

  useEffect(() => {
    if (!output) {
      router.push("/planner");
    }
  }, [output, router]);

  useEffect(() => {
    if (!output) return;
    const already = localStorage.getItem(SURVEY_STORAGE_KEY);
    if (already) return;
    const t = setTimeout(() => {
      setShowSurvey(true);
      trackSurveyShown();
    }, 25000);
    return () => clearTimeout(t);
  }, [output]);

  if (!output) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="text-ink-3">Redirecting to planner...</div>
      </div>
    );
  }

  const handlePrint = () => {
    window.open("/print", "_blank");
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Nav */}
      <div className="no-print">
        <SiteNav />
      </div>

      {/* Plan sub-header — plan name + controls */}
      <div className="border-b border-rule/60 bg-paper no-print">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <span className="text-sm text-ink-2 font-medium truncate">
            {output.eventPlan.eventName || "Race Plan"}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/planner">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
                Edit plan
              </Button>
            </Link>
            <Button size="sm" onClick={handlePrint}>
              <Download className="h-4 w-4" />
              Export Race Card
            </Button>
          </div>
        </div>
      </div>

      {/* Feedback prompt — shown as a slim bar below the nav */}
      <div className="border-b border-rule/50 bg-paper/30 no-print">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-2">
          {feedback === "pending" ? (
            <>
              <p className="text-xs text-ink-3">Was this fuelling plan helpful?</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFeedback(true)}
                  className="flex items-center gap-1.5 rounded-md border border-rule px-2.5 py-1 text-xs text-ink-3 transition-colors hover:border-forest/50 hover:bg-forest/10 hover:text-forest"
                >
                  <ThumbsUp className="h-3 w-3" />
                  Yes
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  className="flex items-center gap-1.5 rounded-md border border-rule px-2.5 py-1 text-xs text-ink-3 transition-colors hover:border-rule hover:text-ink-2"
                >
                  <ThumbsDown className="h-3 w-3" />
                  Not really
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-ink-3">
              {feedback === "positive"
                ? "Thanks — glad it was useful."
                : "Thanks for the feedback — we'll keep improving."}
            </p>
          )}
        </div>
      </div>

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
          <div className={`border-b ${groupedErrors.length > 0 ? "border-rule bg-ochre-hover/20" : "border-rule/50"}`}>
            <div className="mx-auto max-w-6xl px-6 py-2.5">
              <div className="flex flex-wrap gap-2">
                {shownInfo.map((w, i) => (
                  <div key={`info-${i}`} className="flex items-start gap-1.5 rounded px-2.5 py-1.5 text-xs bg-paper-2/40 text-ink-3">
                    <span className="shrink-0 mt-px">ℹ️</span>
                    <span>{w.message}</span>
                  </div>
                ))}
                {groupedErrors.map((w, i) => (
                  <div key={`err-${i}`} className="flex items-start gap-1.5 rounded px-2.5 py-1.5 text-xs bg-clay/15 text-clay">
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
      <div className="border-b border-rule bg-paper no-print">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex gap-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-3.5 text-sm font-medium transition-colors border-b-2",
                  activeTab === tab.id
                    ? "border-ochre text-ochre"
                    : "border-transparent text-ink-3 hover:text-ink-2"
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

      {showSurvey && <SurveyModal onClose={() => setShowSurvey(false)} />}
    </div>
  );
}
