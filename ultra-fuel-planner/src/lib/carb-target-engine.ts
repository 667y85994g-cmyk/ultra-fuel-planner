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
  EventIntent,
  CarbTargetRecommendation,
  CarbTargetRationale,
} from "@/types";

// ─── Duration bands ───────────────────────────────────────────────────────────

/**
 * Evidence-informed carb intake bands by race duration.
 *
 * Six bands cover the full range of endurance events. Key design principles:
 *
 *   - Ranges shift down gradually as duration increases — there is no sudden
 *     drop at a single threshold.
 *   - Ultra-distance trail running differs from road events: intensity is
 *     lower, fat oxidation contributes more, terrain disrupts fuelling cadence,
 *     and GI tolerance is the practical ceiling. Practical ranges therefore sit
 *     below road endurance literature figures.
 *   - Bands are intentionally wide (25–35g/hr). Individual variation is large.
 *     The working target is positioned within the band by experience, race
 *     priority and gut tolerance ceiling — not fixed at the midpoint.
 *
 * Under 6 hours (55–90g/hr):
 *   Short high-intensity events. Gut handles up to 90g/hr with dual-source
 *   fuelling; transit time is not a concern.
 *
 * 6–10 hours (50–80g/hr):
 *   Classic ultra/mountain marathon range. Mixed intensity allows consistent
 *   fuelling; most trained runners can sustain 60–70g/hr comfortably.
 *
 * 10–16 hours (45–70g/hr):
 *   Longer mountain ultras (~50–100km depending on terrain). GI stress begins
 *   to accumulate in the second half. The upper end requires a trained gut.
 *
 * 16–24 hours (40–65g/hr):
 *   Typical 100km and shorter 100-mile runners. Fat oxidation covers a larger
 *   fraction of energy — pushing above 65g/hr gives diminishing returns and
 *   increases GI risk. 45–55g/hr is achievable for most intermediates.
 *
 * 24–36 hours (35–60g/hr):
 *   Long 100-mile and 200km events. Gut tolerability is the primary constraint.
 *   Solid food windows become important for variety and palatability.
 *
 * 36+ hours (30–55g/hr):
 *   Extreme-duration multi-day events. Conservative targets protect GI function.
 *   Experienced runners with very strong gut training can push toward 55g/hr.
 */
interface DurationBand {
  maxHours: number;
  label: string;
  baseLow: number;
  baseHigh: number;
}

const DURATION_BANDS: DurationBand[] = [
  { maxHours: 6,        label: "Under 6 hours",    baseLow: 55, baseHigh: 90 },
  { maxHours: 10,       label: "6–10 hour event",  baseLow: 50, baseHigh: 80 },
  { maxHours: 16,       label: "10–16 hour event", baseLow: 45, baseHigh: 70 },
  { maxHours: 24,       label: "16–24 hour event", baseLow: 40, baseHigh: 65 },
  { maxHours: 36,       label: "24–36 hour event", baseLow: 35, baseHigh: 60 },
  { maxHours: Infinity, label: "36+ hour event",   baseLow: 30, baseHigh: 55 },
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
 * @param eventIntent      Session intent — training runs use reduced race-day carb demands
 */
export function recommendCarbTarget(
  experienceLevel: ExperienceLevel,
  durationMinutes: number | undefined,
  racePriority: RacePriority | undefined,
  maxCarbsPerHour: number,
  eventIntent?: EventIntent,
): CarbTargetRecommendation {
  const targetHours = (durationMinutes ?? 360) / 60; // default 6h if unknown
  const band = getBand(targetHours);
  const expAdj = EXPERIENCE_ADJUSTMENTS[experienceLevel];
  const notes: string[] = [];

  // Band midpoint — the neutral starting point for this duration
  const bandMid = (band.baseLow + band.baseHigh) / 2;

  // Apply event intent adjustment.
  // Training runs: carb demands are lower — race-day fuelling intensity is not needed.
  // Fuelling practice: treat like race day (deliberate rehearsal of full targets).
  // The adjustment is only meaningful for shorter sessions (<8h); longer training
  // sessions already sit within a lower duration band and need no further reduction.
  let intentAdj = 0;
  if (eventIntent === "training_run") {
    if (targetHours < 5) {
      intentAdj = -8;
      notes.push("Training run (<5h): carb target reduced — race-day demands don't apply to this session.");
    } else if (targetHours < 8) {
      intentAdj = -5;
      notes.push("Training run (5–8h): carb target slightly reduced from race-day level.");
    }
  }

  // Apply experience adjustment
  const adjustedMid = bandMid + expAdj + intentAdj;
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
