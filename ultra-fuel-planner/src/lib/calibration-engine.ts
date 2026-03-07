/**
 * Calibration engine — derives burn rate estimates and carb targets
 * from an athlete's prior training / race efforts.
 *
 * This is the core of the "personalised estimate" approach:
 * instead of generic lookup tables, we use the runner's own data
 * to estimate how hard the target event will be for them.
 */

import type {
  PriorEffort,
  AthleteProfile,
  CalibrationResult,
  ConfidenceLevel,
  BurnRateBand,
  ExperienceLevel,
  RacePriority,
} from "@/types";
import { estimateKcalPerHour } from "./energy-model";

// ─── Main calibration function ───────────────────────────────────────────────

/**
 * Takes prior efforts + athlete profile and returns a CalibrationResult.
 *
 * Strategy:
 *   1. If a prior effort includes device-reported calories → use those directly
 *   2. If not → estimate kcal/hr from distance, time, elevation and bodyweight
 *   3. Average across efforts, weighted by recency and similarity to target
 *   4. Derive a carb target range from the burn estimate and event duration
 *   5. Assess confidence based on data quality and quantity
 */
export function calibrateFromPriorEfforts(
  efforts: PriorEffort[],
  athlete: AthleteProfile,
  targetDurationMinutes?: number,
  racePriority?: RacePriority,
): CalibrationResult {
  const assumptionsMade: string[] = [];
  const confidenceNotes: string[] = [];

  if (efforts.length === 0) {
    return buildFallbackCalibration(athlete, targetDurationMinutes, racePriority);
  }

  // Step 1: Extract kcal/hr from each effort
  const effortEstimates = efforts.map((effort) => {
    const durationHours = effort.durationMinutes / 60;
    let kcalPerHour: number;
    let source: "device" | "estimated";

    if (effort.caloriesBurned && effort.caloriesBurned > 0) {
      kcalPerHour = effort.caloriesBurned / durationHours;
      source = "device";
    } else {
      kcalPerHour = estimateKcalPerHour(
        athlete.bodyweightKg,
        effort.distanceKm,
        effort.durationMinutes,
        effort.elevationGainM,
      );
      source = "estimated";
      assumptionsMade.push(
        `Burn rate for "${effort.label}" estimated from pace and elevation (no device calories provided).`
      );
    }

    return { effort, kcalPerHour, source, durationHours };
  });

  // Step 2: Weight by reliability (device data > estimated)
  const deviceEstimates = effortEstimates.filter((e) => e.source === "device");
  const estimatedEstimates = effortEstimates.filter((e) => e.source === "estimated");

  let weightedKcalPerHour: number;
  if (deviceEstimates.length > 0) {
    // Prefer device data; give it 2× weight
    const deviceAvg = average(deviceEstimates.map((e) => e.kcalPerHour));
    const estimatedAvg = estimatedEstimates.length > 0
      ? average(estimatedEstimates.map((e) => e.kcalPerHour))
      : deviceAvg;
    weightedKcalPerHour = deviceEstimates.length >= estimatedEstimates.length
      ? deviceAvg * 0.8 + estimatedAvg * 0.2
      : deviceAvg * 0.6 + estimatedAvg * 0.4;
  } else {
    weightedKcalPerHour = average(effortEstimates.map((e) => e.kcalPerHour));
    assumptionsMade.push(
      "No device calorie data available — all burn estimates derived from pace and elevation."
    );
  }

  // Step 3: Apply race intensity adjustment
  // If this is an A-race, they'll push harder than training → +8-12%
  // If completion-focused, they may be more conservative → -5%
  let intensityAdj = 1.0;
  if (racePriority === "a_race") {
    intensityAdj = 1.10;
    assumptionsMade.push("A-race priority: burn rate adjusted +10% above training data.");
  } else if (racePriority === "completion") {
    intensityAdj = 0.95;
    assumptionsMade.push("Completion focus: burn rate adjusted -5% for conservative pacing.");
  }
  weightedKcalPerHour = Math.round(weightedKcalPerHour * intensityAdj);

  // Step 4: Build range (±15% around the estimate)
  const kcalLow = Math.round(weightedKcalPerHour * 0.85);
  const kcalHigh = Math.round(weightedKcalPerHour * 1.15);

  // Step 5: Derive carb target range from burn rate and event characteristics
  const { carbLow, carbHigh, workingTarget } = deriveCarbTargetRange(
    weightedKcalPerHour,
    athlete,
    targetDurationMinutes,
    racePriority,
    assumptionsMade,
  );

  // Step 6: Assess confidence
  const confidenceLevel = assessConfidence(
    efforts,
    deviceEstimates.length,
    confidenceNotes,
  );

  // Step 7: Classify burn rate band
  const burnRateBand = classifyBurnRate(weightedKcalPerHour);

  if (efforts.length === 1) {
    confidenceNotes.push(
      "Based on a single prior effort. Adding more reference runs will improve accuracy."
    );
  }

  return {
    estimatedKcalPerHour: weightedKcalPerHour,
    kcalPerHourRange: [kcalLow, kcalHigh],
    suggestedCarbRangeGPerHour: [carbLow, carbHigh],
    workingCarbTargetGPerHour: workingTarget,
    confidenceLevel,
    confidenceNotes,
    burnRateBand,
    assumptionsMade,
    priorEffortsUsed: efforts.length,
  };
}

// ─── Carb target derivation ──────────────────────────────────────────────────

/**
 * Derives a recommended carb intake range based on:
 *   - Estimated burn rate → baseline carb need
 *   - Event duration → longer events need sustainable intake
 *   - Gut tolerance → hard cap
 *   - Experience level → more experienced = higher confidence in aggressive targets
 *   - Race priority → A-race may warrant pushing closer to ceiling
 */
function deriveCarbTargetRange(
  kcalPerHour: number,
  athlete: AthleteProfile,
  targetDurationMinutes?: number,
  racePriority?: RacePriority,
  assumptions?: string[],
): { carbLow: number; carbHigh: number; workingTarget: number } {
  const targetHours = (targetDurationMinutes ?? 360) / 60; // default 6h

  // Baseline: every 300 kcal burned → ~25g exogenous carbs
  // This gives carbsPerHour = kcalPerHour / 12
  const baselineCarbs = kcalPerHour / 12;

  // Duration adjustment:
  //   <3h: can be more aggressive (higher % replacement)
  //   3-8h: standard ultra range
  //   8h+: may need to reduce rate for gut sustainability
  let durationFactor: number;
  if (targetHours < 3) {
    durationFactor = 1.15; // shorter events: higher replacement rate sustainable
  } else if (targetHours <= 8) {
    durationFactor = 1.0;
  } else if (targetHours <= 16) {
    durationFactor = 0.92; // very long: slightly conservative for gut
    assumptions?.push("Event >8 hours: carb target adjusted slightly for sustained gut tolerance.");
  } else {
    durationFactor = 0.85;
    assumptions?.push("Event >16 hours: conservative carb target for gut sustainability.");
  }

  // Experience factor
  const expBonus = experienceMultiplier(athlete.experienceLevel);

  // Range
  const mid = Math.round(baselineCarbs * durationFactor * expBonus);
  const carbLow = Math.max(30, Math.round(mid * 0.80));
  const carbHigh = Math.min(athlete.maxCarbsPerHour, Math.round(mid * 1.20));

  // Working target: midpoint, capped at gut tolerance
  let workingTarget = Math.round(mid);
  if (racePriority === "a_race" && athlete.experienceLevel !== "novice") {
    // Push toward upper range for A-races
    workingTarget = Math.round(mid * 1.08);
    assumptions?.push("A-race: working carb target pushed toward upper range.");
  } else if (racePriority === "completion") {
    // Stay conservative
    workingTarget = Math.round(mid * 0.92);
  }
  workingTarget = Math.max(30, Math.min(athlete.maxCarbsPerHour, workingTarget));

  return { carbLow, carbHigh, workingTarget };
}

function experienceMultiplier(level: ExperienceLevel): number {
  switch (level) {
    case "elite": return 1.10;
    case "experienced": return 1.05;
    case "intermediate": return 1.0;
    case "novice": return 0.90;
  }
}

// ─── Confidence assessment ───────────────────────────────────────────────────

function assessConfidence(
  efforts: PriorEffort[],
  deviceDataCount: number,
  notes: string[],
): ConfidenceLevel {
  let score = 0;

  // More efforts = better
  if (efforts.length >= 3) score += 3;
  else if (efforts.length === 2) score += 2;
  else score += 1;

  // Device calories = better
  if (deviceDataCount >= 2) score += 2;
  else if (deviceDataCount === 1) score += 1;
  else notes.push("No device calorie data — estimates are less precise.");

  // Heart rate data = better
  const hrCount = efforts.filter((e) => e.avgHeartRate && e.avgHeartRate > 0).length;
  if (hrCount > 0) score += 1;

  // Variety of effort types (different distances/terrains)
  const distances = efforts.map((e) => e.distanceKm);
  const hasRange = distances.length > 1 && (Math.max(...distances) - Math.min(...distances)) > 10;
  if (hasRange) {
    score += 1;
    notes.push("Prior efforts span a good range of distances.");
  }

  if (score >= 6) return "high";
  if (score >= 3) return "moderate";
  return "low";
}

// ─── Burn rate classification ────────────────────────────────────────────────

function classifyBurnRate(kcalPerHour: number): BurnRateBand {
  if (kcalPerHour < 400) return "lower";
  if (kcalPerHour <= 600) return "middle";
  return "higher";
}

// ─── Fallback (no prior data) ────────────────────────────────────────────────

/**
 * When no prior effort data is available, build a rough estimate
 * from bodyweight, experience and target event characteristics.
 */
function buildFallbackCalibration(
  athlete: AthleteProfile,
  targetDurationMinutes?: number,
  racePriority?: RacePriority,
): CalibrationResult {
  // Rough estimate: 6-8 kcal/kg/hr for trail ultra running
  const factorByExperience: Record<ExperienceLevel, number> = {
    novice: 6.5,
    intermediate: 7.0,
    experienced: 7.5,
    elite: 8.5,
  };
  const factor = factorByExperience[athlete.experienceLevel];
  const kcalPerHour = Math.round(factor * athlete.bodyweightKg);

  const { carbLow, carbHigh, workingTarget } = deriveCarbTargetRange(
    kcalPerHour,
    athlete,
    targetDurationMinutes,
    racePriority,
    [],
  );

  return {
    estimatedKcalPerHour: kcalPerHour,
    kcalPerHourRange: [
      Math.round(kcalPerHour * 0.80),
      Math.round(kcalPerHour * 1.20),
    ],
    suggestedCarbRangeGPerHour: [carbLow, carbHigh],
    workingCarbTargetGPerHour: workingTarget,
    confidenceLevel: "low",
    confidenceNotes: [
      "No prior effort data provided. Estimate is based on bodyweight and experience level only.",
      "Add at least one prior race or long run to improve accuracy.",
    ],
    burnRateBand: classifyBurnRate(kcalPerHour),
    assumptionsMade: [
      `Estimated ~${factor} kcal/kg/hr based on ${athlete.experienceLevel} experience level.`,
      "This is a rough population-level estimate. Your actual burn rate may differ significantly.",
    ],
    priorEffortsUsed: 0,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
