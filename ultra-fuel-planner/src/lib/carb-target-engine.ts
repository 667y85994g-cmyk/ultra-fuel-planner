/**
 * Carb Target Engine — Layer 2 of the four-layer planning architecture.
 *
 * Responsibility: determine how many grams of carbohydrate per hour
 * the athlete should aim to consume during their event.
 *
 * ── Core principle ──────────────────────────────────────────────────────────
 *
 * Carbohydrate intake targets are determined by RACE DURATION and RUNNER
 * CONTEXT (experience level, race priority, gut tolerance). They are NOT
 * derived from calories burned.
 *
 * Why not calories? Caloric expenditure rises sharply with event duration
 * because you're burning more fat at lower intensities. But the gut's
 * capacity to absorb exogenous carbohydrate does not increase — it stays
 * around 60–90g/hr regardless of how long you've been running, and may
 * actually decrease with fatigue and GI stress over very long efforts.
 *
 * A 20-hour runner does not need more carbs per hour than a 6-hour runner.
 * Recommending kcalPerHour / 12 as a carb target would push long-distance
 * athletes above gut tolerance, causing GI distress.
 *
 * ── What this module does ────────────────────────────────────────────────────
 *
 * 1. Selects a duration band that sets the evidence-informed intake range
 * 2. Applies a small experience-level adjustment within the band
 * 3. Applies a small race-priority shift (A-race pushes toward ceiling)
 * 4. Applies the athlete's gut tolerance ceiling as a hard cap
 *
 * ── What this module does NOT do ────────────────────────────────────────────
 *
 * - It does not use kcal/hr, burn rate, or any energy-model output
 * - It does not determine fuelling timing (that is Layer 3 / energy-model.ts)
 * - It does not select which products to use (that is Layer 3 / fuelling-engine.ts)
 */

import type {
  ExperienceLevel,
  RacePriority,
  CarbTargetRecommendation,
  CarbTargetRationale,
} from "@/types";

// ─── Duration bands ───────────────────────────────────────────────────────────

/**
 * Evidence-informed carb intake bands by race duration.
 *
 * Short events (<3h): higher carb replacement rate is sustainable — gut
 *   can handle up to 80g/hr and intestinal transit time is not a concern.
 *
 * Medium events (3–10h): range narrows somewhat; 60–70g/hr is a well-
 *   established sweet spot for trained ultra runners.
 *
 * Long events (10–16h): gut stress accumulates. Reducing the working target
 *   to ~45–55g/hr lowers GI risk without meaningfully compromising energy
 *   delivery — fat oxidation covers the gap.
 *
 * Very long events (16h+): gut tolerability is the limiting factor.
 *   Targets of 30–50g/hr are realistic for most athletes; experienced
 *   runners with trained guts can push slightly higher.
 *
 * These ranges are intentionally wide: individual variation is large.
 * The working target is set within the band based on experience and priority.
 */
interface DurationBand {
  maxHours: number;
  label: string;
  baseLow: number;
  baseHigh: number;
}

const DURATION_BANDS: DurationBand[] = [
  { maxHours: 3,        label: "Under 3 hours",    baseLow: 55, baseHigh: 80 },
  { maxHours: 6,        label: "3–6 hour event",   baseLow: 48, baseHigh: 70 },
  { maxHours: 10,       label: "6–10 hour event",  baseLow: 42, baseHigh: 62 },
  { maxHours: 16,       label: "10–16 hour event", baseLow: 36, baseHigh: 55 },
  { maxHours: Infinity, label: "16+ hour event",   baseLow: 30, baseHigh: 50 },
];

// ─── Experience adjustments ───────────────────────────────────────────────────

/**
 * Signed g/hr adjustment applied to the band midpoint based on experience.
 *
 * More experienced runners:
 *   - Have trained guts with higher absorption capacity
 *   - Execute fuelling more consistently under fatigue
 *   - Tolerate closer-to-ceiling targets without GI distress
 *
 * Novice runners start conservative: the risk of GI distress from
 * aggressive fuelling in a race setting is higher before gut training.
 */
const EXPERIENCE_ADJUSTMENTS: Record<ExperienceLevel, number> = {
  elite:        +5,
  experienced:  +3,
  intermediate:  0,
  novice:       -5,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Recommends a carbohydrate intake target for a given event and athlete.
 *
 * The returned `workingTargetGPerHour` is the single value used throughout
 * the fuelling plan. The `recommendedRangeGPerHour` gives the athlete
 * context for how much flexibility exists around that target.
 *
 * @param experienceLevel  Athlete's training/racing experience
 * @param durationMinutes  Estimated race duration in minutes (use planning time)
 * @param racePriority     How the athlete is approaching this event
 * @param maxCarbsPerHour  Individual gut tolerance ceiling — acts as a hard cap
 */
export function recommendCarbTarget(
  experienceLevel: ExperienceLevel,
  durationMinutes: number | undefined,
  racePriority: RacePriority | undefined,
  maxCarbsPerHour: number,
): CarbTargetRecommendation {
  const targetHours = (durationMinutes ?? 360) / 60; // default 6h if unknown
  const band = getBand(targetHours);
  const expAdj = EXPERIENCE_ADJUSTMENTS[experienceLevel];
  const notes: string[] = [];

  // Band midpoint — the neutral starting point for this duration
  const bandMid = (band.baseLow + band.baseHigh) / 2;

  // Apply experience adjustment
  const adjustedMid = bandMid + expAdj;
  if (expAdj !== 0) {
    const direction = expAdj > 0 ? "increased" : "decreased";
    const levelLabel = experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1);
    notes.push(
      `${levelLabel} athlete: target ${direction} by ${Math.abs(expAdj)}g/hr within the ${band.label} band.`
    );
  }

  // Race priority — modest shift within the band (not beyond it)
  let priorityAdj = 0;
  if (racePriority === "a_race") {
    priorityAdj = +3;
    notes.push("A-race priority: target shifted toward the upper end of the range.");
  } else if (racePriority === "completion") {
    priorityAdj = -2;
    notes.push("Completion focus: target kept toward the conservative end of the range.");
  }

  // Working target — clamped to the experience-adjusted band
  const clampLow  = band.baseLow  + Math.min(0, expAdj);
  const clampHigh = band.baseHigh + Math.max(0, expAdj);
  let workingTarget = Math.round(
    Math.max(clampLow, Math.min(clampHigh, adjustedMid + priorityAdj))
  );

  // Apply gut tolerance ceiling (hard cap)
  let gutToleranceCap: number | undefined;
  if (workingTarget > maxCarbsPerHour) {
    gutToleranceCap = maxCarbsPerHour;
    workingTarget = maxCarbsPerHour;
    notes.push(`Target capped at athlete gut tolerance ceiling: ${maxCarbsPerHour}g/hr.`);
  }

  // Build recommended range
  const low  = Math.max(30, Math.min(workingTarget - 5, clampLow));
  const high = Math.min(maxCarbsPerHour, Math.max(workingTarget + 5, clampHigh));

  const rationale: CarbTargetRationale = {
    primaryDriver: "race_duration",
    durationBandLabel: band.label,
    experienceAdjustment: expAdj,
    racePriorityAdjustment: priorityAdj,
    gutToleranceCap,
    notes,
  };

  return {
    recommendedRangeGPerHour: [Math.round(low), Math.round(high)],
    workingTargetGPerHour: workingTarget,
    rationale,
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getBand(targetHours: number): DurationBand {
  return (
    DURATION_BANDS.find((b) => targetHours <= b.maxHours) ??
    DURATION_BANDS[DURATION_BANDS.length - 1]
  );
}
