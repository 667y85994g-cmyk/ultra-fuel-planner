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
  FinishTimeEstimation,
} from "@/types";
import { estimateKcalPerHour } from "./energy-model";
import { recommendCarbTarget } from "./carb-target-engine";

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

  // Step 5: Derive carb target from race duration and athlete context.
  // Note: burn rate (kcal/hr) informs WHEN to fuel (execution timing) but
  // does NOT determine HOW MUCH to target per hour. See carb-target-engine.ts.
  const carbRec = recommendCarbTarget(
    athlete.experienceLevel,
    targetDurationMinutes,
    racePriority,
    athlete.maxCarbsPerHour,
  );
  const carbLow = carbRec.recommendedRangeGPerHour[0];
  const carbHigh = carbRec.recommendedRangeGPerHour[1];
  const workingTarget = carbRec.workingTargetGPerHour;
  if (carbRec.rationale.notes.length > 0) {
    assumptionsMade.push(...carbRec.rationale.notes);
  }

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

  const carbRec = recommendCarbTarget(
    athlete.experienceLevel,
    targetDurationMinutes,
    racePriority,
    athlete.maxCarbsPerHour,
  );
  const carbLow = carbRec.recommendedRangeGPerHour[0];
  const carbHigh = carbRec.recommendedRangeGPerHour[1];
  const workingTarget = carbRec.workingTargetGPerHour;

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

// ─── Finish time estimation ──────────────────────────────────────────────────

/**
 * Guardrail constants for finish-time estimation.
 *
 * MAX_SCALE_RATIO  — maximum allowed ratio between target and reference distance.
 *                    Prevents a 1 km effort being used as an anchor for a 26 km run.
 * MIN_EFFORT_KM    — efforts shorter than this are ignored (likely malformed data).
 * MIN_EFFORT_MINS  — efforts shorter than this are ignored.
 * MIN/MAX_PACE     — implied pace bounds for sanity-checking both inputs and outputs.
 */
const FTE_MAX_SCALE_RATIO     = 4.0;   // e.g. 26 km target → rejects anything outside 6.5–104 km
const FTE_MIN_EFFORT_KM       = 2.0;
const FTE_MIN_EFFORT_MINS     = 10;
const FTE_MIN_PACE_MIN_PER_KM = 2.5;  // sub-2:30/km is physically impossible for any meaningful distance
const FTE_MAX_PACE_MIN_PER_KM = 22.0; // slower than this is walking, not running

/** Broad distance class used to prefer distance-appropriate reference efforts. */
type DistanceClass = "short" | "long" | "ultra";

function classifyDistance(km: number): DistanceClass {
  if (km < 15) return "short";
  if (km < 40) return "long";
  return "ultra";
}

/**
 * Returns true if a prior effort has plausible distance, duration, and pace.
 * Filters out malformed localStorage entries before they can contaminate estimates.
 */
function isValidEffortForFTE(effort: PriorEffort): boolean {
  if (effort.distanceKm < FTE_MIN_EFFORT_KM) return false;
  if (effort.durationMinutes < FTE_MIN_EFFORT_MINS) return false;
  const pace = effort.durationMinutes / effort.distanceKm;
  if (pace < FTE_MIN_PACE_MIN_PER_KM) return false;  // faster than world record — bad data
  if (pace > FTE_MAX_PACE_MIN_PER_KM) return false;  // this is walking not running
  return true;
}

/**
 * Estimates finish time for a target event by anchoring on the most similar
 * valid prior effort. Hardened against malformed data and extreme distance
 * mismatches that would produce nonsensical results.
 *
 * Layers of protection:
 *   1. Validate all prior efforts — reject implausible distance/duration/pace values
 *   2. Filter by MAX_SCALE_RATIO — reject reference efforts that are too dissimilar
 *      in distance to scale from reliably
 *   3. Prefer distance-class-matched efforts (short/long/ultra)
 *   4. Sanity-check the final estimate — if implied pace is outside realistic
 *      endurance bounds, discard and fall back to conservative default pace
 */
export function estimateFinishTime(
  efforts: PriorEffort[],
  targetDistanceKm: number,
  routeAscentM: number | undefined,
  athlete: AthleteProfile,
  racePriority?: RacePriority,
): FinishTimeEstimation {
  const explanation: string[] = [];

  // ── 1. Validate prior efforts ─────────────────────────────────────────────
  const validEfforts = efforts.filter(isValidEffortForFTE);
  const rejectedCount = efforts.length - validEfforts.length;
  if (rejectedCount > 0) {
    explanation.push(
      `${rejectedCount} prior effort${rejectedCount > 1 ? "s" : ""} excluded — distance, duration or pace data was implausible.`
    );
  }

  if (validEfforts.length === 0) {
    return buildFallbackFinishEstimate(targetDistanceKm, routeAscentM, athlete, racePriority, explanation);
  }

  // ── 2. Filter by scale ratio ──────────────────────────────────────────────
  // A reference distance too far from the target produces unreliable scaling.
  // e.g. a 1 km effort should never anchor a 26 km estimate (ratio = 26 >> 4).
  const withinRatio = validEfforts.filter(e =>
    Math.max(targetDistanceKm, e.distanceKm) / Math.min(targetDistanceKm, e.distanceKm) <= FTE_MAX_SCALE_RATIO
  );

  // ── 3. Prefer distance-class-matched efforts ──────────────────────────────
  const targetClass = classifyDistance(targetDistanceKm);
  let candidates = withinRatio.filter(e => classifyDistance(e.distanceKm) === targetClass);

  if (candidates.length === 0) {
    const adjacentClasses: DistanceClass[] =
      targetClass === "short" ? ["long"]          :
      targetClass === "long"  ? ["short", "ultra"] :
      /* ultra */               ["long"];
    candidates = withinRatio.filter(e => adjacentClasses.includes(classifyDistance(e.distanceKm)));
  }
  if (candidates.length === 0) {
    candidates = withinRatio; // any within-ratio effort
  }
  if (candidates.length === 0) {
    // No valid effort is close enough in distance to scale from reliably
    explanation.push(
      `No prior effort within ${FTE_MAX_SCALE_RATIO}× of target distance (${targetDistanceKm.toFixed(0)} km) — using fallback pace estimate.`
    );
    return buildFallbackFinishEstimate(targetDistanceKm, routeAscentM, athlete, racePriority, explanation);
  }

  // ── 4. Select best anchor (closest distance match) ────────────────────────
  const scored = candidates
    .map(e => ({
      effort: e,
      similarity: Math.min(e.distanceKm, targetDistanceKm) / Math.max(e.distanceKm, targetDistanceKm),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  const { effort: anchorEffort, similarity: distSimilarity } = scored[0];
  const anchorPaceMinPerKm = anchorEffort.durationMinutes / anchorEffort.distanceKm;
  let estimatedPace = anchorPaceMinPerKm;

  // ── 5. Scale pace for distance difference ─────────────────────────────────
  if (distSimilarity >= 0.80) {
    explanation.push(
      `Anchored on "${anchorEffort.label}" (${anchorEffort.distanceKm} km in ${formatHrsMins(anchorEffort.durationMinutes)}) — close distance match.`
    );
  } else {
    const distRatio = targetDistanceKm / anchorEffort.distanceKm;
    if (distRatio > 1) {
      // Target is longer → pace degrades with distance
      const degradation = 1 + (distRatio - 1) * 0.10;
      estimatedPace *= degradation;
      explanation.push(
        `Scaled from "${anchorEffort.label}" (${anchorEffort.distanceKm} km) to ${targetDistanceKm} km — pace adjusted +${Math.round((degradation - 1) * 100)}% for longer distance.`
      );
    } else {
      // Target is shorter → pace slightly faster
      const reduction = 1 - (1 - distRatio) * 0.05;
      estimatedPace *= reduction;
      explanation.push(
        `Scaled from "${anchorEffort.label}" (${anchorEffort.distanceKm} km) to ${targetDistanceKm} km — pace adjusted slightly for shorter distance.`
      );
    }
  }

  let estimatedMins = Math.round(targetDistanceKm * estimatedPace);

  // ── 6. Elevation adjustment ───────────────────────────────────────────────
  if (routeAscentM && anchorEffort.elevationGainM && anchorEffort.elevationGainM > 0) {
    const eleRatio = routeAscentM / anchorEffort.elevationGainM;
    if (eleRatio > 1.20) {
      const adj = Math.min(0.20, (eleRatio - 1) * 0.15);
      estimatedMins = Math.round(estimatedMins * (1 + adj));
      explanation.push(
        `Route has ${Math.round((eleRatio - 1) * 100)}% more elevation than reference — time adjusted +${Math.round(adj * 100)}%.`
      );
    } else if (eleRatio < 0.80) {
      const adj = Math.min(0.10, (1 - eleRatio) * 0.10);
      estimatedMins = Math.round(estimatedMins * (1 - adj));
      explanation.push("Route has less elevation than reference — time reduced slightly.");
    }
  }

  // ── 7. Race priority adjustment ───────────────────────────────────────────
  if (racePriority === "a_race") {
    estimatedMins = Math.round(estimatedMins * 0.97);
    explanation.push("A-race effort: small pace improvement assumed (~3%).");
  } else if (racePriority === "completion") {
    estimatedMins = Math.round(estimatedMins * 1.05);
    explanation.push("Completion focus: conservative pacing assumed (+5%).");
  }

  // ── 8. Sanity check — reject if implied pace is outside realistic bounds ──
  // This is the last line of defence: even if an effort passed the earlier
  // filters, the scaled result could still be nonsensical.
  const impliedPaceMinPerKm = estimatedMins / targetDistanceKm;
  if (impliedPaceMinPerKm < FTE_MIN_PACE_MIN_PER_KM || impliedPaceMinPerKm > FTE_MAX_PACE_MIN_PER_KM) {
    explanation.push(
      `Estimated pace (${impliedPaceMinPerKm.toFixed(1)} min/km) is outside plausible endurance range — falling back to conservative estimate.`
    );
    return buildFallbackFinishEstimate(targetDistanceKm, routeAscentM, athlete, racePriority, explanation);
  }

  // ── 9. Apply 2% conservative bias and build result ────────────────────────
  const planningMins = Math.round(estimatedMins * 1.02);
  const confidence: ConfidenceLevel = distSimilarity >= 0.80 ? "moderate" : "low";
  const rangeFactor = confidence === "moderate" ? 0.10 : 0.15;
  const range: [number, number] = [
    Math.round(estimatedMins * (1 - rangeFactor)),
    Math.round(estimatedMins * (1 + rangeFactor)),
  ];

  explanation.push(
    `Planning time: ${formatHrsMins(planningMins)} (range: ${formatHrsMins(range[0])} – ${formatHrsMins(range[1])}).`
  );

  return {
    estimatedMinutes: planningMins,
    rangeMinutes: range,
    confidence,
    method: "prior_effort_anchor",
    explanation,
  };
}

/**
 * Shared fallback path used when no valid/comparable prior effort can be found.
 * Produces a conservative estimate from experience level + distance class only.
 */
function buildFallbackFinishEstimate(
  targetDistanceKm: number,
  routeAscentM: number | undefined,
  athlete: AthleteProfile,
  racePriority: RacePriority | undefined,
  explanation: string[],
): FinishTimeEstimation {
  const pace = conservativeDefaultPace(targetDistanceKm, athlete);
  let estimatedMins = Math.round(targetDistanceKm * pace);

  if (routeAscentM && routeAscentM > 0) {
    const eleAdj = Math.round(routeAscentM / 100);
    estimatedMins += eleAdj;
  }

  if (racePriority === "a_race") {
    estimatedMins = Math.round(estimatedMins * 0.97);
  } else if (racePriority === "completion") {
    estimatedMins = Math.round(estimatedMins * 1.05);
  }

  const planningMins = Math.round(estimatedMins * 1.02);
  const range: [number, number] = [
    Math.round(estimatedMins * 0.85),
    Math.round(estimatedMins * 1.20),
  ];

  explanation.push(
    `Using conservative pace (${pace.toFixed(1)} min/km) based on ${athlete.experienceLevel} experience and ${targetDistanceKm.toFixed(0)} km distance class.`
  );
  explanation.push(
    `Planning time: ${formatHrsMins(planningMins)} (range: ${formatHrsMins(range[0])} – ${formatHrsMins(range[1])}).`
  );

  return {
    estimatedMinutes: planningMins,
    rangeMinutes: range,
    confidence: "low",
    method: "fallback",
    explanation,
  };
}

/**
 * Conservative default pace when no comparable prior effort data is available.
 * Returns min/km based on experience level and target distance class.
 */
function conservativeDefaultPace(distanceKm: number, athlete: AthleteProfile): number {
  const basePace: Record<ExperienceLevel, number> = {
    novice: 11.0,
    intermediate: 9.5,
    experienced: 8.5,
    elite: 7.0,
  };
  let pace = basePace[athlete.experienceLevel];
  // Longer races → slower average pace
  if (distanceKm > 80) pace *= 1.15;
  else if (distanceKm > 50) pace *= 1.08;
  return pace;
}

function formatHrsMins(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
