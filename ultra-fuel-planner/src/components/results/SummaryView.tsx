"use client";

import type { PlannerOutput, PlanConfidence, FinishTimeEstimation, HydrationGuidance, ElectrolyteGuidance, RecoveryGuidance, EventIntent } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration, fuelTypeIcon } from "@/lib/utils";
import { Droplets, FlaskConical, Coffee, Package, Info, ShieldCheck, ShieldAlert, Clock, MapPin, Zap } from "lucide-react";

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
        <div className="flex items-center flex-wrap gap-2">
          <h2 className="text-xl font-bold text-ink">
            {eventPlan.eventName || "Race"} — {intentPlanLabel(eventPlan.eventIntent)}
          </h2>
          {eventPlan.eventIntent && eventPlan.eventIntent !== "race_day" && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              eventPlan.eventIntent === "training_run"
                ? "bg-ufp-slate/15 text-ufp-slate"
                : "bg-ochre/15 text-ochre"
            }`}>
              {eventPlan.eventIntent === "training_run" ? "Training run" : "Fuelling practice"}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-3">
          Estimated {eventPlan.eventIntent === "race_day" ? "race" : "session"} duration:{" "}
          <span className="font-medium text-ink-2">
            {formatDuration(summary.totalRaceDurationMinutes)}
          </span>
          {summary.finishTimeEstimation && (
            <span className="ml-2 text-xs text-ink-3">
              estimated from your prior efforts
            </span>
          )}
        </p>
      </div>

      {/* ── Your fuelling plan ─────────────────────────────────────────────── */}
      <Card className="border-ochre/30 bg-ochre-hover/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-ochre">Your fuelling plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-1 gap-6 ${carbRange ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {carbRange && (
              <div>
                <p className="text-xs text-ink-3">Recommended range</p>
                <p className="text-2xl font-bold text-ochre">
                  {carbRange[0]}–{carbRange[1]}{" "}
                  <span className="text-base font-normal text-ink-3">g/hr</span>
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-ink-3">Working target</p>
              <p className="text-2xl font-bold text-ink">
                {workingTarget}{" "}
                <span className="text-base font-normal text-ink-3">g/hr</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-3">Planned average</p>
              <p className="text-2xl font-bold text-ink-2">
                {summary.avgCarbsPerHour}{" "}
                <span className="text-base font-normal text-ink-3">g/hr</span>
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-rule">
            <p className="text-xs text-ink-3 leading-relaxed">
              {buildCarbTargetExplanation(
                workingTarget,
                summary.totalRaceDurationMinutes / 60,
                athlete.experienceLevel,
                eventPlan.racePriority,
              )}
            </p>
            {summary.estimatedTotalKcal !== undefined && (
              <p className="mt-1.5 text-xs text-ink-3">
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
        <Card className="border-rule/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-ink-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              On the route
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.fuelFormatNotes.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-ink-3 leading-relaxed">
                  <span className="text-ink-3 flex-shrink-0 mt-0.5">•</span>
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
          <CardTitle className="text-sm text-ink-2">Race totals</CardTitle>
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
                <p className="text-xs text-ink-3">{item.label}</p>
                <p className="mt-1 text-xl font-bold text-ink">{item.value}</p>
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
              <h3 className="text-sm font-semibold text-ink-2">Plan delivery</h3>
              <p className="text-xs text-ink-3">
                How closely the schedule hits your carb target
              </p>
            </div>
            <span
              className={`text-2xl font-bold ${
                summary.coverageScore >= 90
                  ? "text-forest"
                  : summary.coverageScore >= 70
                  ? "text-ochre"
                  : "text-clay"
              }`}
            >
              {summary.coverageScore}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-paper-2">
            <div
              className={`h-full rounded-full transition-all ${
                summary.coverageScore >= 90
                  ? "bg-forest"
                  : summary.coverageScore >= 70
                  ? "bg-ochre-hover"
                  : "bg-clay"
              }`}
              style={{ width: `${summary.coverageScore}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-ink-3">
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
          <CardTitle className="text-sm text-ink-2 flex items-center gap-2">
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
                    className="flex items-center gap-3 rounded-lg bg-paper/60 px-4 py-3"
                  >
                    <span className="inline-flex items-center justify-center w-8 h-6 rounded text-[10px] font-mono text-ink-3 bg-paper-2 shrink-0">
                      {fuelItem ? fuelTypeIcon(fuelItem.type) : "—"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-2 truncate">{item.name}</p>
                      <p className="text-xs text-ink-3">
                        {Math.round(item.carbsG)}g carbs total
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xl font-bold text-ink">
                        ×{item.quantity}
                      </div>
                      <div className="text-xs text-ink-3">
                        {item.quantity === 1 ? "serving" : "servings"}
                      </div>
                    </div>
                  </div>
                );
              })}

            {Object.keys(summary.itemTotals).length === 0 && (
              <p className="text-sm text-ink-3 text-center py-4">
                No fuel items scheduled.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Recovery guidance (training & practice sessions only) ───────────── */}
      {summary.recoveryGuidance && (
        <RecoveryCard guidance={summary.recoveryGuidance} />
      )}
    </div>
  );
}

// ─── Intent plan label ────────────────────────────────────────────────────────

function intentPlanLabel(intent: EventIntent | undefined): string {
  switch (intent) {
    case "training_run":      return "Training Plan";
    case "fuelling_practice": return "Fuelling Practice Plan";
    default:                  return "Race Plan";
  }
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

  return `Working target for a ${hours}-hour ${durationContext}, based on current endurance fuelling guidance. Adjusted for ${toleranceLabel} and a ${strategyLabel} approach.${priorityNote} Practise your fuelling strategy in training before race day.`;
}

// ─── Confidence card ──────────────────────────────────────────────────────────

function ConfidenceCard({ confidence }: { confidence: PlanConfidence }) {
  const isHigh = confidence.overall === "high";
  const isLow  = confidence.overall === "low";
  const Icon   = isLow ? ShieldAlert : ShieldCheck;
  const color  = isHigh ? "text-forest" : isLow ? "text-ochre" : "text-ufp-slate";
  const border = isHigh ? "border-forest/30" : isLow ? "border-ochre/30" : "border-ufp-slate/30";

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
              <h3 className="text-sm font-semibold text-ink-2">
                Plan reliability: {confidence.overall}
              </h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isHigh ? "bg-forest/15 text-forest"
                  : isLow ? "bg-ochre-hover/30 text-ochre"
                  : "bg-ufp-slate/15 text-ufp-slate"
                }`}
              >
                {calibrationLabel}
              </span>
            </div>
            <ul className="space-y-1">
              {confidence.notes.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-ink-3">
                  <Info className="h-3 w-3 flex-shrink-0 mt-0.5 text-ink-3" />
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
    estimation.confidence === "high"     ? "text-forest"
    : estimation.confidence === "moderate" ? "text-ufp-slate"
    : "text-ochre";
  const confBg =
    estimation.confidence === "high"     ? "bg-forest/15 text-forest"
    : estimation.confidence === "moderate" ? "bg-ufp-slate/15 text-ufp-slate"
    : "bg-ochre-hover/30 text-ochre";
  const methodLabel =
    estimation.method === "prior_effort_anchor" ? "Based on your prior efforts"
    : estimation.method === "pace_based"         ? "Pace-based estimate"
    : "General estimate";

  return (
    <Card className="border-rule/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-ink-2 flex items-center gap-2">
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
            <p className="text-xs text-ink-3">Planning time</p>
            <p className={`mt-1 text-xl font-bold ${confColor}`}>
              {formatDuration(estimation.estimatedMinutes)}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-3">Likely range</p>
            <p className="mt-1 text-xl font-bold text-ink">
              {formatDuration(estimation.rangeMinutes[0])} – {formatDuration(estimation.rangeMinutes[1])}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-3">How we estimated</p>
            <p className="mt-1 text-sm font-medium text-ink-2">{methodLabel}</p>
          </div>
        </div>
        <ul className="mt-3 space-y-1">
          {estimation.explanation.map((note, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-ink-3">
              <Info className="h-3 w-3 flex-shrink-0 mt-0.5 text-ink-3" />
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
    <Card className={guidance.isWarmConditions ? "border-ufp-slate/40" : "border-rule/30"}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-ink-3 font-medium">Hydration</span>
          <Droplets className="h-4 w-4 text-ufp-slate" />
        </div>
        <p className="text-2xl font-bold text-ufp-slate">
          {guidance.rangeMlPerHour[0]}–{guidance.rangeMlPerHour[1]}{" "}
          <span className="text-base font-normal text-ink-3">ml/hr</span>
        </p>
        <p className="text-xs text-ink-3 mt-1 font-medium">{guidance.label}</p>
        <p className="text-xs text-ink-3 mt-2 leading-relaxed">{guidance.note}</p>
      </CardContent>
    </Card>
  );
}

// ─── Electrolyte guidance card ────────────────────────────────────────────────

function ElectrolyteCard({ guidance }: { guidance: ElectrolyteGuidance }) {
  const tierColor =
    guidance.tier === "high"     ? "text-ochre"
    : guidance.tier === "moderate" ? "text-forest"
    : "text-ink-2";
  const tierBg =
    guidance.tier === "high"     ? "bg-ochre-hover/20 border-ochre/40"
    : guidance.tier === "moderate" ? "bg-forest/10 border-forest/30"
    : "border-rule/30";

  return (
    <Card className={tierBg}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-ink-3 font-medium">Electrolytes</span>
          <FlaskConical className="h-4 w-4 text-forest" />
        </div>
        <p className={`text-sm font-bold ${tierColor}`}>{guidance.label}</p>
        <p className="text-xs text-ink-3 mt-2 leading-relaxed">{guidance.note}</p>
      </CardContent>
    </Card>
  );
}

// ─── Caffeine card ────────────────────────────────────────────────────────────

function CaffeineCard({ totalMg, limitMg }: { totalMg: number; limitMg?: number }) {
  const pct = limitMg ? Math.min(100, Math.round((totalMg / limitMg) * 100)) : null;
  return (
    <Card className="border-rule/30">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-ink-3 font-medium">Caffeine</span>
          <Coffee className="h-4 w-4 text-ink-2" />
        </div>
        <p className="text-2xl font-bold text-ink-2">
          {totalMg}
          <span className="text-base font-normal text-ink-3"> mg</span>
        </p>
        <p className="text-xs text-ink-3 mt-1">
          {limitMg ? `Limit: ${limitMg}mg` : "No limit set"}
        </p>
        {pct !== null && (
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-paper-2">
              <div
                className="h-full rounded-full bg-ink-3 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-ink-3 mt-1">{pct}% of limit</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Recovery guidance card ───────────────────────────────────────────────────

function RecoveryCard({ guidance }: { guidance: RecoveryGuidance }) {
  const windows = [
    { label: "Within 30 minutes",  text: guidance.immediateWindow },
    { label: "1–2 hours after",    text: guidance.twoHourWindow },
    { label: "Rest of day",        text: guidance.dayWindow },
  ];

  return (
    <Card className="border-forest/30 bg-forest/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-forest flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Post-session recovery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {windows.map(({ label, text }) => (
          <div key={label}>
            <p className="text-xs font-semibold text-ink-2 mb-0.5">{label}</p>
            <p className="text-xs text-ink-3 leading-relaxed">{text}</p>
          </div>
        ))}
        {guidance.sodiumNote && (
          <div className="rounded-lg border border-ufp-slate/30 bg-ufp-slate/10 px-3 py-2">
            <p className="text-xs text-ufp-slate leading-relaxed">
              <span className="font-semibold">Electrolytes: </span>
              {guidance.sodiumNote}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
