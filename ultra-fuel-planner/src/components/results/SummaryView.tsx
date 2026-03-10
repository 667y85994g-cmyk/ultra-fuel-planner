"use client";

import type { PlannerOutput, PlanConfidence, FinishTimeEstimation, HydrationGuidance, ElectrolyteGuidance } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration, fuelTypeIcon } from "@/lib/utils";
import { Droplets, FlaskConical, Coffee, Package, Info, ShieldCheck, ShieldAlert, Clock, MapPin } from "lucide-react";

interface Props {
  output: PlannerOutput;
}

export function SummaryView({ output }: Props) {
  const { summary, eventPlan, confidence } = output;
  const athlete = eventPlan.athlete;

  const carbRange = summary.carbTargetRangeGPerHour;
  const workingTarget = summary.workingCarbTarget ?? athlete.carbTargetPerHour;

  return (
    <div className="space-y-6">

      {/* ── Race overview ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-stone-50">
          {eventPlan.eventName || "Race"} — Race Plan
        </h2>
        <p className="mt-1 text-sm text-stone-400">
          Estimated race duration:{" "}
          <span className="font-medium text-stone-200">
            {formatDuration(summary.totalRaceDurationMinutes)}
          </span>
          {summary.finishTimeEstimation && (
            <span className="ml-2 text-xs text-stone-600">
              estimated from your prior efforts
            </span>
          )}
        </p>
      </div>

      {/* ── Your fuelling plan ─────────────────────────────────────────────── */}
      <Card className="border-amber-800/30 bg-amber-950/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-amber-400">Your fuelling plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-1 gap-6 ${carbRange ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {carbRange && (
              <div>
                <p className="text-xs text-stone-500 min-h-[2.25rem] flex items-start">Recommended range</p>
                <p className="text-2xl font-bold text-amber-400">
                  {carbRange[0]}–{carbRange[1]}{" "}
                  <span className="text-base font-normal text-stone-400">g/hr</span>
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-stone-500 min-h-[2.25rem] flex items-start">Working target</p>
              <p className="text-2xl font-bold text-stone-100">
                {workingTarget}{" "}
                <span className="text-base font-normal text-stone-400">g/hr</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500 min-h-[2.25rem] flex items-start">Planned average</p>
              <p className="text-2xl font-bold text-stone-300">
                {summary.avgCarbsPerHour}{" "}
                <span className="text-base font-normal text-stone-500">g/hr</span>
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-stone-800">
            <p className="text-xs text-stone-500 leading-relaxed">
              {buildCarbTargetExplanation(
                workingTarget,
                summary.totalRaceDurationMinutes / 60,
                athlete.experienceLevel,
                eventPlan.racePriority,
              )}
            </p>
            {summary.estimatedTotalKcal !== undefined && (
              <p className="mt-1.5 text-xs text-stone-600">
                Estimated energy expenditure: ~{summary.avgKcalPerHour?.toLocaleString()} kcal/hr
                {" · "}~{summary.estimatedTotalKcal.toLocaleString()} kcal total (context only — does not determine your carb target)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Hydration · Electrolytes · Caffeine ────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {summary.hydrationGuidance && (
          <HydrationCard guidance={summary.hydrationGuidance} />
        )}
        {summary.electrolyteGuidance && (
          <ElectrolyteCard guidance={summary.electrolyteGuidance} />
        )}
        <CaffeineCard totalMg={summary.totalCaffeinesMg} limitMg={athlete.caffeineMaxMg} />
      </div>

      {/* ── Finish time (when derived from prior efforts) ───────────────────── */}
      {summary.finishTimeEstimation && (
        <FinishTimeCard estimation={summary.finishTimeEstimation} />
      )}

      {/* ── On the route ───────────────────────────────────────────────────── */}
      {summary.fuelFormatNotes && summary.fuelFormatNotes.length > 0 && (
        <Card className="border-stone-700/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-stone-300 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              On the route
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.fuelFormatNotes.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-stone-400 leading-relaxed">
                  <span className="text-stone-600 flex-shrink-0 mt-0.5">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ── Plan reliability ────────────────────────────────────────────────── */}
      <ConfidenceCard confidence={confidence} />

      {/* ── Race totals ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-stone-300">Race totals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total carbs",   value: `${Math.round(summary.totalCarbsG)}g` },
              { label: "Planned fluid", value: `~${(summary.totalFluidMl / 1000).toFixed(1)}L` },
              { label: "Total caffeine", value: `${summary.totalCaffeinesMg}mg` },
              { label: "Race duration", value: formatDuration(summary.totalRaceDurationMinutes) },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-stone-500">{item.label}</p>
                <p className="mt-1 text-xl font-bold text-stone-100">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Plan delivery ───────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-stone-200">Plan delivery</h3>
              <p className="text-xs text-stone-500">
                How closely the schedule hits your carb target
              </p>
            </div>
            <span
              className={`text-2xl font-bold ${
                summary.coverageScore >= 90
                  ? "text-green-400"
                  : summary.coverageScore >= 70
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {summary.coverageScore}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-stone-800">
            <div
              className={`h-full rounded-full transition-all ${
                summary.coverageScore >= 90
                  ? "bg-green-600"
                  : summary.coverageScore >= 70
                  ? "bg-amber-600"
                  : "bg-red-600"
              }`}
              style={{ width: `${summary.coverageScore}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-stone-500">
            {summary.coverageScore >= 90
              ? "Schedule is on track with your carb target."
              : summary.coverageScore >= 70
              ? "Schedule is slightly below your carb target."
              : "Schedule falls short of your carb target — consider adjusting your fuel selection."}
          </p>
        </CardContent>
      </Card>

      {/* ── What to pack ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-stone-300 flex items-center gap-2">
            <Package className="h-4 w-4" />
            What to pack
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(summary.itemTotals)
              .sort(([, a], [, b]) => b.quantity - a.quantity)
              .map(([id, item]) => {
                const fuelItem = eventPlan.fuelInventory.find((f) => f.id === id);
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 rounded-lg bg-stone-900/60 px-4 py-3"
                  >
                    <span className="text-xl flex-shrink-0">
                      {fuelItem ? fuelTypeIcon(fuelItem.type) : "📦"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-200 truncate">{item.name}</p>
                      <p className="text-xs text-stone-500">
                        {Math.round(item.carbsG)}g carbs total
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xl font-bold text-stone-100">
                        ×{item.quantity}
                      </div>
                      <div className="text-xs text-stone-500">
                        {item.quantity === 1 ? "serving" : "servings"}
                      </div>
                    </div>
                  </div>
                );
              })}

            {Object.keys(summary.itemTotals).length === 0 && (
              <p className="text-sm text-stone-500 text-center py-4">
                No fuel items scheduled.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Experience label ─────────────────────────────────────────────────────────

function experienceLabel(level: string): string {
  switch (level) {
    case "novice":       return "beginner ultra";
    case "intermediate": return "intermediate";
    case "experienced":  return "experienced ultra";
    case "elite":        return "elite";
    default:             return level;
  }
}

// ─── Carb target explanation ──────────────────────────────────────────────────
//
// Builds a plain-English sentence explaining the working carb target.
// Avoids language that implies precise physiological calculation.
// Uses runner-friendly framing: "practical target", "based on race duration".

function buildCarbTargetExplanation(
  workingTarget: number,
  totalRaceHours: number,
  experienceLevel: string,
  racePriority?: string,
): string {
  const hours = Math.round(totalRaceHours);

  const durationContext =
    hours < 6  ? "shorter race"
    : hours < 9  ? "long day out"
    : hours < 14 ? "ultra-distance race"
    : hours < 20 ? "long ultra"
    : "very long ultra";

  const toleranceLabel =
    experienceLevel === "novice"       ? "beginner fuelling tolerance"
    : experienceLevel === "intermediate" ? "moderate fuelling tolerance"
    : experienceLevel === "experienced"  ? "higher fuelling capacity"
    : "elite-level fuelling capacity";

  const strategyLabel =
    hours < 6  ? "short-race pacing"
    : hours < 10 ? "endurance pacing"
    : hours < 16 ? "long-duration pacing"
    : "ultra-endurance pacing";

  const priorityNote =
    racePriority === "a_race"    ? " Adjusted upward slightly — this is your A race."
    : racePriority === "completion" ? " Kept conservative — completion-focused approach."
    : "";

  return `Practical target for a ${hours}-hour ${durationContext}, ${toleranceLabel}, and ${strategyLabel} strategy.${priorityNote}`;
}

// ─── Confidence card ──────────────────────────────────────────────────────────

function ConfidenceCard({ confidence }: { confidence: PlanConfidence }) {
  const isHigh = confidence.overall === "high";
  const isLow  = confidence.overall === "low";
  const Icon   = isLow ? ShieldAlert : ShieldCheck;
  const color  = isHigh ? "text-green-400" : isLow ? "text-amber-400" : "text-blue-400";
  const border = isHigh ? "border-green-800/30" : isLow ? "border-amber-800/30" : "border-blue-800/30";

  const calibrationLabel =
    confidence.calibrationQuality === "none"    ? "Using general guidelines"
    : confidence.calibrationQuality === "limited" ? "Partially personalised"
    : confidence.calibrationQuality === "good"    ? "Personalised from your efforts"
    : "Well personalised";

  return (
    <Card className={border}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${color}`} />
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <h3 className="text-sm font-semibold text-stone-200">
                Plan reliability: {confidence.overall}
              </h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isHigh ? "bg-green-900/30 text-green-400"
                  : isLow ? "bg-amber-900/30 text-amber-400"
                  : "bg-blue-900/30 text-blue-400"
                }`}
              >
                {calibrationLabel}
              </span>
            </div>
            <ul className="space-y-1">
              {confidence.notes.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-stone-500">
                  <Info className="h-3 w-3 flex-shrink-0 mt-0.5 text-stone-600" />
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Finish time card ─────────────────────────────────────────────────────────

function FinishTimeCard({ estimation }: { estimation: FinishTimeEstimation }) {
  const confColor =
    estimation.confidence === "high"     ? "text-green-400"
    : estimation.confidence === "moderate" ? "text-blue-400"
    : "text-amber-400";
  const confBg =
    estimation.confidence === "high"     ? "bg-green-900/30 text-green-400"
    : estimation.confidence === "moderate" ? "bg-blue-900/30 text-blue-400"
    : "bg-amber-900/30 text-amber-400";
  const methodLabel =
    estimation.method === "prior_effort_anchor" ? "Based on your prior efforts"
    : estimation.method === "pace_based"         ? "Pace-based estimate"
    : "General estimate";

  return (
    <Card className="border-stone-700/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-stone-300 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Finish time estimate
          <span className={`text-xs px-2 py-0.5 rounded-full ${confBg}`}>
            {estimation.confidence} confidence
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-stone-500">Planning time</p>
            <p className={`mt-1 text-xl font-bold ${confColor}`}>
              {formatDuration(estimation.estimatedMinutes)}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Likely range</p>
            <p className="mt-1 text-xl font-bold text-stone-100">
              {formatDuration(estimation.rangeMinutes[0])} – {formatDuration(estimation.rangeMinutes[1])}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500">How we estimated</p>
            <p className="mt-1 text-sm font-medium text-stone-300">{methodLabel}</p>
          </div>
        </div>
        <ul className="mt-3 space-y-1">
          {estimation.explanation.map((note, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-stone-500">
              <Info className="h-3 w-3 flex-shrink-0 mt-0.5 text-stone-600" />
              {note}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ─── Hydration guidance card ──────────────────────────────────────────────────

function HydrationCard({ guidance }: { guidance: HydrationGuidance }) {
  return (
    <Card className={guidance.isWarmConditions ? "border-blue-800/40" : "border-stone-700/30"}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-stone-500 font-medium">Hydration</span>
          <Droplets className="h-4 w-4 text-blue-400" />
        </div>
        <p className="text-2xl font-bold text-blue-400">
          {guidance.rangeMlPerHour[0]}–{guidance.rangeMlPerHour[1]}{" "}
          <span className="text-base font-normal text-stone-400">ml/hr</span>
        </p>
        <p className="text-xs text-stone-400 mt-1 font-medium">{guidance.label}</p>
        <p className="text-xs text-stone-500 mt-2 leading-relaxed">{guidance.note}</p>
      </CardContent>
    </Card>
  );
}

// ─── Electrolyte guidance card ────────────────────────────────────────────────

function ElectrolyteCard({ guidance }: { guidance: ElectrolyteGuidance }) {
  const tierColor =
    guidance.tier === "high"     ? "text-amber-400"
    : guidance.tier === "moderate" ? "text-green-400"
    : "text-stone-300";
  const tierBg =
    guidance.tier === "high"     ? "bg-amber-900/20 border-amber-800/40"
    : guidance.tier === "moderate" ? "bg-green-900/10 border-green-800/30"
    : "border-stone-700/30";

  return (
    <Card className={tierBg}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-stone-500 font-medium">Electrolytes</span>
          <FlaskConical className="h-4 w-4 text-green-400" />
        </div>
        <p className={`text-sm font-bold ${tierColor}`}>{guidance.label}</p>
        <p className="text-xs text-stone-500 mt-2 leading-relaxed">{guidance.note}</p>
      </CardContent>
    </Card>
  );
}

// ─── Caffeine card ────────────────────────────────────────────────────────────

function CaffeineCard({ totalMg, limitMg }: { totalMg: number; limitMg?: number }) {
  const pct = limitMg ? Math.min(100, Math.round((totalMg / limitMg) * 100)) : null;
  return (
    <Card className="border-stone-700/30">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-stone-500 font-medium">Caffeine</span>
          <Coffee className="h-4 w-4 text-purple-400" />
        </div>
        <p className="text-2xl font-bold text-purple-400">
          {totalMg}
          <span className="text-base font-normal text-stone-400"> mg</span>
        </p>
        <p className="text-xs text-stone-500 mt-1">
          {limitMg ? `Limit: ${limitMg}mg` : "No limit set"}
        </p>
        {pct !== null && (
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-stone-800">
              <div
                className="h-full rounded-full bg-purple-600 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-stone-600 mt-1">{pct}% of limit</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
