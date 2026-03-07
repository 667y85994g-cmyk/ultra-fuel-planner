"use client";

import type { PlannerOutput, PlanConfidence, BurnRateBand, FinishTimeEstimation, HydrationGuidance, ElectrolyteGuidance } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDuration, fuelTypeIcon } from "@/lib/utils";
import { Zap, Droplets, FlaskConical, Coffee, Package, Flame, Info, ShieldCheck, ShieldAlert, Clock, MessageSquareText } from "lucide-react";

interface Props {
  output: PlannerOutput;
}

export function SummaryView({ output }: Props) {
  const { summary, eventPlan, confidence } = output;
  const athlete = eventPlan.athlete;

  const carbPct = Math.min(
    100,
    Math.round((summary.avgCarbsPerHour / athlete.carbTargetPerHour) * 100)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-stone-50">
          {eventPlan.eventName || "Race"} — Fuelling Summary
        </h2>
        <p className="mt-1 text-sm text-stone-400">
          Estimated race duration:{" "}
          <span className="font-medium text-stone-200">
            {formatDuration(summary.totalRaceDurationMinutes)}
          </span>
        </p>
      </div>

      {/* Key metrics — carbs (precise) + caffeine */}
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          icon={Zap}
          label="Avg carbs/hr"
          value={`${summary.avgCarbsPerHour}g`}
          target={`Target: ${athlete.carbTargetPerHour}g`}
          pct={carbPct}
          color="text-amber-400"
          progressColor="bg-amber-600"
        />
        <MetricCard
          icon={Coffee}
          label="Total caffeine"
          value={`${summary.totalCaffeinesMg}mg`}
          target={
            athlete.caffeineMaxMg
              ? `Limit: ${athlete.caffeineMaxMg}mg`
              : "No limit set"
          }
          pct={
            athlete.caffeineMaxMg
              ? Math.min(
                  100,
                  Math.round(
                    (summary.totalCaffeinesMg / athlete.caffeineMaxMg) * 100
                  )
                )
              : null
          }
          color="text-purple-400"
          progressColor="bg-purple-600"
        />
      </div>

      {/* Hydration & electrolyte guidance — ranges, not false precision */}
      <div className="grid gap-4 sm:grid-cols-2">
        {summary.hydrationGuidance && (
          <HydrationCard guidance={summary.hydrationGuidance} />
        )}
        {summary.electrolyteGuidance && (
          <ElectrolyteCard guidance={summary.electrolyteGuidance} />
        )}
      </div>

      {/* Calibration & burn rate */}
      {summary.estimatedTotalKcal !== undefined && (
        <Card className="border-amber-800/30 bg-amber-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-amber-400 flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Estimated energy expenditure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-stone-500">Avg burn rate</p>
                <p className="mt-1 text-xl font-bold text-amber-400">{summary.avgKcalPerHour} kcal/hr</p>
                {summary.burnRateBand && (
                  <p className="text-xs text-stone-600">{burnRateBandLabel(summary.burnRateBand)}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-stone-500">Total expenditure</p>
                <p className="mt-1 text-xl font-bold text-amber-400">
                  {summary.estimatedTotalKcal.toLocaleString()} kcal
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Working carb target</p>
                <p className="mt-1 text-xl font-bold text-stone-100">
                  {summary.workingCarbTarget ?? athlete.carbTargetPerHour} g/hr
                </p>
                {summary.carbTargetRangeGPerHour && (
                  <p className="text-xs text-stone-600">
                    range: {summary.carbTargetRangeGPerHour[0]}–{summary.carbTargetRangeGPerHour[1]} g/hr
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-stone-500">Planned carbs</p>
                <p className="mt-1 text-xl font-bold text-stone-100">
                  {summary.avgCarbsPerHour} g/hr
                </p>
                <p className="text-xs text-stone-600">
                  replacing ~{summary.avgKcalPerHour ? Math.round((summary.avgCarbsPerHour * 4.1 / summary.avgKcalPerHour) * 100) : 0}% of burn
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-stone-600">
              Estimates are based on your prior effort data and route profile. Fuelling intervals vary by terrain gradient and pace.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Finish time estimation — shown when derived from prior efforts */}
      {summary.finishTimeEstimation && (
        <FinishTimeCard estimation={summary.finishTimeEstimation} />
      )}

      {/* Plan confidence */}
      <ConfidenceCard confidence={confidence} />

      {/* Fuel format rationale */}
      {summary.fuelFormatNotes && summary.fuelFormatNotes.length > 0 && (
        <Card className="border-stone-700/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-stone-300 flex items-center gap-2">
              <MessageSquareText className="h-4 w-4" />
              Fuel format rationale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {summary.fuelFormatNotes.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-stone-500">
                  <Info className="h-3 w-3 flex-shrink-0 mt-0.5 text-stone-600" />
                  {note}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Totals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-stone-300">Race totals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total carbs", value: `${Math.round(summary.totalCarbsG)}g` },
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

      {/* Coverage score */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-stone-200">
                Inventory coverage
              </h3>
              <p className="text-xs text-stone-500">
                How well your fuel inventory covers your carb targets
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
          <Progress value={summary.coverageScore} className="h-2" />
          <p className="mt-2 text-xs text-stone-500">
            {summary.coverageScore >= 90
              ? "Good — inventory should cover your race."
              : summary.coverageScore >= 70
              ? "Acceptable — account for aid station resupply."
              : "Low — add more inventory or plan for significant aid station reliance."}
          </p>
        </CardContent>
      </Card>

      {/* Item breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-stone-300 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Item breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(summary.itemTotals)
              .sort(([, a], [, b]) => b.carbsG - a.carbsG)
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
                      <p className="text-sm font-medium text-stone-200 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-stone-500">
                        {item.quantity} serving{item.quantity !== 1 ? "s" : ""} ·{" "}
                        {Math.round(item.carbsG)}g carbs
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm font-semibold text-amber-400">
                        {Math.round(item.carbsG)}g
                      </div>
                      <div className="text-xs text-stone-500">carbs</div>
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

// ─── Confidence card ─────────────────────────────────────────────────────────

function ConfidenceCard({ confidence }: { confidence: PlanConfidence }) {
  const isHigh = confidence.overall === "high";
  const isLow = confidence.overall === "low";
  const Icon = isLow ? ShieldAlert : ShieldCheck;
  const color = isHigh ? "text-green-400" : isLow ? "text-amber-400" : "text-blue-400";
  const borderColor = isHigh ? "border-green-800/30" : isLow ? "border-amber-800/30" : "border-blue-800/30";

  return (
    <Card className={borderColor}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${color}`} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-stone-200">
                Plan confidence: {confidence.overall}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isHigh ? "bg-green-900/30 text-green-400"
                : isLow ? "bg-amber-900/30 text-amber-400"
                : "bg-blue-900/30 text-blue-400"
              }`}>
                {confidence.calibrationQuality === "none" ? "No calibration data"
                  : `${confidence.calibrationQuality} calibration`}
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
  const confColor = estimation.confidence === "high"
    ? "text-green-400" : estimation.confidence === "moderate"
    ? "text-blue-400" : "text-amber-400";
  const confBg = estimation.confidence === "high"
    ? "bg-green-900/30 text-green-400" : estimation.confidence === "moderate"
    ? "bg-blue-900/30 text-blue-400" : "bg-amber-900/30 text-amber-400";

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
            <p className="text-xs text-stone-500">Expected range</p>
            <p className="mt-1 text-xl font-bold text-stone-100">
              {formatDuration(estimation.rangeMinutes[0])} – {formatDuration(estimation.rangeMinutes[1])}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Method</p>
            <p className="mt-1 text-sm font-medium text-stone-300">
              {estimation.method === "prior_effort_anchor"
                ? "Anchored on prior effort"
                : estimation.method === "pace_based"
                ? "Pace-based estimate"
                : "Default estimate"}
            </p>
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

// ─── Hydration guidance card ─────────────────────────────────────────────────

function HydrationCard({ guidance }: { guidance: HydrationGuidance }) {
  const borderColor = guidance.isWarmConditions ? "border-blue-800/40" : "border-stone-700/30";
  return (
    <Card className={borderColor}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-stone-500 font-medium">Hydration target</span>
          <Droplets className="h-4 w-4 text-blue-400" />
        </div>
        <p className="text-2xl font-bold text-blue-400">
          {guidance.rangeMlPerHour[0]}–{guidance.rangeMlPerHour[1]} ml/hr
        </p>
        <p className="text-xs text-stone-400 mt-1 font-medium">{guidance.label}</p>
        <p className="text-xs text-stone-500 mt-2 leading-relaxed">{guidance.note}</p>
      </CardContent>
    </Card>
  );
}

// ─── Electrolyte guidance card ──────────────────────────────────────────────

function ElectrolyteCard({ guidance }: { guidance: ElectrolyteGuidance }) {
  const tierColor = guidance.tier === "high"
    ? "text-amber-400" : guidance.tier === "moderate"
    ? "text-green-400" : "text-stone-300";
  const tierBg = guidance.tier === "high"
    ? "bg-amber-900/20 border-amber-800/40"
    : guidance.tier === "moderate"
    ? "bg-green-900/10 border-green-800/30"
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function burnRateBandLabel(band: BurnRateBand): string {
  switch (band) {
    case "lower": return "lower estimate — conservative";
    case "middle": return "mid-range estimate";
    case "higher": return "higher estimate — aggressive";
  }
}

function MetricCard({
  icon: Icon,
  label,
  value,
  target,
  pct,
  color,
  progressColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  target: string;
  pct: number | null;
  color: string;
  progressColor: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-stone-500 font-medium">{label}</span>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-stone-500 mt-1">{target}</p>
        {pct !== null && (
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-stone-800">
              <div
                className={`h-full rounded-full ${progressColor} transition-all`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-stone-600 mt-1">{pct}% of target</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
