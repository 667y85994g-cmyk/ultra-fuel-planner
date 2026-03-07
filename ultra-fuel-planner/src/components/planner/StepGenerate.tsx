"use client";

import { usePlanner } from "@/lib/planner-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Zap, CheckCircle, AlertTriangle, Info, Route, FlaskConical, MapPin } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { DEFAULT_ASSUMPTIONS } from "@/types";
import { segmentRoute } from "@/lib/segmentation";

interface Props {
  onBack: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function StepGenerate({ onBack, onGenerate, isGenerating }: Props) {
  const { state } = usePlanner();
  const athlete = state.athlete!;
  const route = state.parsedRoute;
  const inventory = state.fuelInventory ?? [];
  const stations = state.aidStations ?? [];

  // Re-segment if needed to get duration estimate
  let segments = route?.segments ?? [];
  if (route && segments.length === 0) {
    segments = segmentRoute(route, DEFAULT_ASSUMPTIONS);
  }
  const estimatedMinutes = segments.reduce(
    (a, s) => a + s.estimatedDurationMinutes,
    0
  );
  const totalCarbs = inventory.reduce(
    (a, item) => a + item.carbsPerServing * item.quantityAvailable,
    0
  );
  const carbsNeeded = (athlete.carbTargetPerHour * estimatedMinutes) / 60;
  const carbCoverage = carbsNeeded > 0 ? Math.round((totalCarbs / carbsNeeded) * 100) : 100;

  const readyChecks = [
    {
      ok: !!state.eventName,
      label: "Event name",
      hint: "Go back to Step 1 and enter an event name.",
    },
    {
      ok: !!route,
      label: "GPX route",
      hint: "Upload a GPX file in Step 2. Or skip for a time-only plan.",
      optional: true,
    },
    {
      ok: inventory.length > 0,
      label: "Fuel inventory",
      hint: "Add at least one fuel item in Step 3.",
    },
    {
      ok: carbCoverage >= 70 || stations.length > 0,
      label: "Carb coverage",
      hint: `Your inventory covers ${carbCoverage}% of estimated carb needs. Add more items or aid stations.`,
      optional: true,
    },
  ];

  const blockers = readyChecks.filter((c) => !c.ok && !c.optional);
  const canGenerate = blockers.length === 0;

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-50">Review and generate plan</h1>
        <p className="mt-2 text-stone-400">
          Check the summary below, then generate your fuelling plan.
        </p>
      </div>

      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={Route}
            label="Route"
            value={route ? `${route.totalDistanceKm.toFixed(1)}km` : "No GPX"}
            sub={route ? `↑${Math.round(route.totalAscentM).toLocaleString()}m` : "Time-based plan"}
            ok={!!route}
          />
          <SummaryCard
            icon={FlaskConical}
            label="Fuel"
            value={`${inventory.length} items`}
            sub={`${Math.round(totalCarbs)}g carbs total`}
            ok={inventory.length > 0}
          />
          <SummaryCard
            icon={MapPin}
            label="Aid stations"
            value={stations.length === 0 ? "None" : `${stations.length} stations`}
            sub={stations.length === 0 ? "Self-supported carry" : "Resupply planned"}
            ok={true}
          />
        </div>

        {/* Athlete targets */}
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-stone-300">Your targets</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4 text-sm">
              {[
                { label: "Carbs/hr", value: `${athlete.carbTargetPerHour}g` },
                { label: "Fluid/hr", value: `${athlete.fluidTargetPerHourMl}ml` },
                { label: "Sodium/hr", value: `${athlete.sodiumTargetPerHourMg}mg` },
                {
                  label: "Est. duration",
                  value: estimatedMinutes > 0 ? formatDuration(estimatedMinutes) : "—",
                },
              ].map((t) => (
                <div key={t.label}>
                  <p className="text-xs text-stone-500">{t.label}</p>
                  <p className="mt-0.5 font-semibold text-stone-100">{t.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ready checks */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-stone-300">Ready checks</h3>
            {readyChecks.map((check) => (
              <div key={check.label} className="flex items-start gap-3">
                {check.ok ? (
                  <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500 mt-0.5" />
                ) : check.optional ? (
                  <Info className="h-4 w-4 flex-shrink-0 text-amber-500 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500 mt-0.5" />
                )}
                <div>
                  <span
                    className={`text-sm font-medium ${
                      check.ok
                        ? "text-stone-200"
                        : check.optional
                        ? "text-amber-300"
                        : "text-red-300"
                    }`}
                  >
                    {check.label}
                  </span>
                  {!check.ok && (
                    <p className="text-xs text-stone-500 mt-0.5">{check.hint}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Assumptions note */}
        <div className="rounded-lg border border-stone-800 bg-stone-900/30 p-4 text-xs text-stone-500 leading-relaxed">
          <span className="font-medium text-stone-400">Assumptions used: </span>
          Flat pace {DEFAULT_ASSUMPTIONS.paceFlatMinPerKm}min/km · Climb penalty {DEFAULT_ASSUMPTIONS.paceClimbMinPerKmPer100mGain}min per 100m gain · Fuelling interval {DEFAULT_ASSUMPTIONS.minFuelIntervalMinutes}min · Late race after hour {DEFAULT_ASSUMPTIONS.lateRaceHours}.
          All assumptions are visible in the generated plan.
        </div>

        {/* Generate button */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack} disabled={isGenerating}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            size="lg"
            onClick={onGenerate}
            disabled={!canGenerate || isGenerating}
            className="min-w-36"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-400 border-t-white" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Generate Plan
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  ok,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  ok: boolean;
}) {
  return (
    <Card className={ok ? "" : "border-stone-700/50 opacity-60"}>
      <CardContent className="flex items-center gap-3 p-5">
        <div className="rounded-lg bg-amber-900/30 p-2.5 flex-shrink-0">
          <Icon className="h-4 w-4 text-amber-500" />
        </div>
        <div>
          <p className="text-xs text-stone-500">{label}</p>
          <p className="font-semibold text-stone-100">{value}</p>
          <p className="text-xs text-stone-500 mt-0.5">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}
