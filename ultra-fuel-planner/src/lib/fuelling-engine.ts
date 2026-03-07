import type {
  EventPlan,
  PlannerOutput,
  PlanSummary,
  FuelScheduleEntry,
  FuelItem,
  RouteSegment,
  AidStation,
  CarryPlan,
  CarryItem,
  SegmentRecommendation,
  FuelType,
  FuelAction,
  PlanWarning,
  AthleteProfile,
  TerrainType,
  PlannerAssumptions,
  PlanConfidence,
  CalibrationResult,
} from "@/types";
import { getCumulativeTimeMinutes, terrainLabel } from "./segmentation";
import {
  caloricBurnRate,
  fuellingIntervalMinutes,
} from "./energy-model";
import { calibrateFromPriorEfforts } from "./calibration-engine";

// ─── Terrain-based fuelling rules ─────────────────────────────────────────────

interface TerrainRule {
  preferred: FuelType[];
  avoid: FuelType[];
  rationale: string;
  timingNote?: string;
  fuellingFormat: string;
  fluidPriorityMultiplier: number;
}

const TERRAIN_RULES: Record<TerrainType, TerrainRule> = {
  steep_climb: {
    preferred: ["drink_mix", "gel"],
    avoid: ["bar", "chew", "real_food"],
    rationale:
      "Steep climb: breathing is heavy, chewing is impractical. Stick to fluids and gels you can take without breaking stride.",
    timingNote: "Fuel just before the climb starts when possible.",
    fuellingFormat: "Liquids and gels only",
    fluidPriorityMultiplier: 1.4,
  },
  sustained_climb: {
    preferred: ["drink_mix", "gel"],
    avoid: ["bar", "real_food"],
    rationale:
      "Sustained climb: elevated effort makes solid food harder to process. Prefer drink mix and gels.",
    timingNote: "Fuel early in the climb, not at the steepest point.",
    fuellingFormat: "Drinks and gels preferred",
    fluidPriorityMultiplier: 1.25,
  },
  rolling: {
    preferred: ["gel", "drink_mix", "chew"],
    avoid: [],
    rationale:
      "Rolling terrain: mixed effort allows most fuel formats. Gels and drink mix are efficient; chews work on runnable sections.",
    fuellingFormat: "Gels and drinks preferred, chews acceptable",
    fluidPriorityMultiplier: 1.0,
  },
  flat_runnable: {
    preferred: ["gel", "drink_mix", "chew", "bar", "real_food"],
    avoid: [],
    rationale:
      "Flat and runnable: good window for all formats. Gels and drink mix are efficient; solids are also tolerable here.",
    timingNote: "Best opportunity for solid food if needed.",
    fuellingFormat: "All formats work — gels, drinks, solids",
    fluidPriorityMultiplier: 0.9,
  },
  technical_descent: {
    preferred: ["drink_mix"],
    avoid: ["bar", "chew", "real_food", "gel"],
    rationale:
      "Technical descent: concentration required, hands needed for balance. Avoid fiddly fuelling.",
    timingNote: "Fuel at the bottom or top of this descent, not during.",
    fuellingFormat: "Hands-free sipping only",
    fluidPriorityMultiplier: 0.8,
  },
  runnable_descent: {
    preferred: ["drink_mix", "gel"],
    avoid: ["bar", "real_food"],
    rationale:
      "Runnable descent: good pace possible but avoid solid food that disrupts breathing.",
    fuellingFormat: "Gels and drinks",
    fluidPriorityMultiplier: 0.9,
  },
  recovery: {
    preferred: ["drink_mix", "chew", "real_food", "bar"],
    avoid: [],
    rationale:
      "Recovery section: easy effort is a good window to eat real food and add variety.",
    fuellingFormat: "Good opportunity for real food and variety",
    fluidPriorityMultiplier: 0.85,
  },
};

// ─── Calibration-aware target derivation ─────────────────────────────────────

function deriveTargets(
  plan: EventPlan,
  segments: RouteSegment[],
  warnings: PlanWarning[],
): {
  effectiveAthlete: AthleteProfile;
  calibration: CalibrationResult;
  avgKcalPerHour: number;
} {
  // Run calibration (uses prior efforts if available, else falls back)
  const calibration = plan.calibration ?? calibrateFromPriorEfforts(
    plan.priorEfforts ?? [],
    plan.athlete,
    plan.targetFinishTimeMinutes,
    plan.racePriority,
  );

  // Route-adjusted burn rate blended with calibration
  let avgKcalPerHour = calibration.estimatedKcalPerHour;
  if (segments.length > 0) {
    const totalMins = segments.reduce((a, s) => a + s.estimatedDurationMinutes, 0);
    const weightedKcal = segments.reduce((acc, seg) => {
      const speedKmh = 60 / (seg.estimatedPaceMinPerKm || 7);
      const gradient = seg.avgGradientPct / 100;
      const kcalHr = caloricBurnRate(plan.athlete.bodyweightKg, speedKmh, gradient);
      return acc + kcalHr * seg.estimatedDurationMinutes;
    }, 0);
    const routeKcalPerHour = totalMins > 0 ? weightedKcal / totalMins : 500;

    const calibWeight = calibration.confidenceLevel === "high" ? 0.6
      : calibration.confidenceLevel === "moderate" ? 0.5
      : 0.3;
    avgKcalPerHour = Math.round(
      calibration.estimatedKcalPerHour * calibWeight +
      routeKcalPerHour * (1 - calibWeight)
    );
  }

  const carbTarget = Math.min(
    plan.athlete.maxCarbsPerHour,
    calibration.workingCarbTargetGPerHour,
  );

  // Temperature adjustment
  let fluidTarget = plan.athlete.fluidTargetPerHourMl;
  if (plan.expectedTemperatureC && plan.expectedTemperatureC > 25) {
    const bonus = Math.round((plan.expectedTemperatureC - 25) * 20);
    fluidTarget = Math.min(1200, fluidTarget + bonus);
    warnings.push({
      type: "info",
      code: "HEAT_FLUID_ADJUSTED",
      message: `Hot conditions (${plan.expectedTemperatureC}\u00B0C): fluid target increased to ${fluidTarget} ml/hr.`,
    });
  }

  if (calibration.confidenceLevel === "low") {
    warnings.push({
      type: "info",
      code: "LOW_CONFIDENCE",
      message: "Limited calibration data \u2014 this plan uses rough estimates. Add prior race or training data to improve accuracy.",
    });
  }

  warnings.push({
    type: "info",
    code: "CARB_TARGET_SET",
    message: `Working carb target: ${carbTarget}g/hr (recommended range: ${calibration.suggestedCarbRangeGPerHour[0]}\u2013${calibration.suggestedCarbRangeGPerHour[1]}g/hr). Estimated burn rate: ~${avgKcalPerHour} kcal/hr.`,
  });

  if (carbTarget >= plan.athlete.maxCarbsPerHour && carbTarget < calibration.workingCarbTargetGPerHour) {
    warnings.push({
      type: "info",
      code: "CARB_TARGET_CAPPED",
      message: `Calculated carb need (${calibration.workingCarbTargetGPerHour}g/hr) exceeds gut tolerance ceiling (${plan.athlete.maxCarbsPerHour}g/hr). Consider gut training to increase absorption.`,
    });
  }

  return {
    effectiveAthlete: {
      ...plan.athlete,
      carbTargetPerHour: carbTarget,
      fluidTargetPerHourMl: fluidTarget,
    },
    calibration,
    avgKcalPerHour,
  };
}

// ─── Main planner function ────────────────────────────────────────────────────

export function generatePlan(plan: EventPlan): PlannerOutput {
  const warnings: PlanWarning[] = [];
  const { fuelInventory, aidStations, route, assumptions } = plan;

  if (!route || route.segments.length === 0) {
    warnings.push({
      type: "error",
      code: "NO_ROUTE",
      message: "No route data available.",
      detail: "Upload a GPX file to generate a route-aware plan.",
    });
  }

  const segments = route?.segments ?? [];
  const { effectiveAthlete: athlete, calibration, avgKcalPerHour } = deriveTargets(plan, segments, warnings);

  const totalRaceMinutes = segments.reduce((acc, s) => acc + s.estimatedDurationMinutes, 0);
  const totalRaceHours = totalRaceMinutes / 60;

  validateInventory(fuelInventory, athlete, totalRaceHours, warnings);

  const segmentRecommendations = generateSegmentRecommendations(segments, athlete, totalRaceHours);

  const schedule = generateSchedule(
    segments, fuelInventory, aidStations, athlete, assumptions, totalRaceMinutes, warnings
  );

  const carryPlans = generateCarryPlans(
    segments, aidStations, schedule, fuelInventory, athlete, assumptions
  );

  const summary = buildSummary(schedule, fuelInventory, totalRaceMinutes, athlete, segments, avgKcalPerHour, calibration);

  const confidence = buildConfidence(calibration, segments);

  return {
    eventPlan: { ...plan, athlete, calibration },
    summary,
    schedule,
    carryPlans,
    segmentRecommendations,
    warnings,
    confidence,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Confidence builder ──────────────────────────────────────────────────────

function buildConfidence(
  calibration: CalibrationResult,
  segments: RouteSegment[],
): PlanConfidence {
  const notes: string[] = [];

  let calibrationQuality: PlanConfidence["calibrationQuality"] = "none";
  if (calibration.priorEffortsUsed >= 3 && calibration.confidenceLevel === "high") {
    calibrationQuality = "strong";
  } else if (calibration.priorEffortsUsed >= 2) {
    calibrationQuality = "good";
  } else if (calibration.priorEffortsUsed >= 1) {
    calibrationQuality = "limited";
    notes.push("Single reference effort \u2014 add more for better accuracy.");
  } else {
    calibrationQuality = "none";
    notes.push("No prior effort data \u2014 estimates use population averages.");
  }

  if (segments.length > 0) {
    notes.push("Route data provides terrain-aware fuelling adjustments.");
  } else {
    notes.push("No GPX route \u2014 plan uses time-based intervals only.");
  }

  let overall: PlanConfidence["overall"] = "low";
  if (calibrationQuality === "strong" && segments.length > 0) {
    overall = "high";
  } else if (calibrationQuality !== "none" && segments.length > 0) {
    overall = "moderate";
  }

  notes.push("This is a practical estimate. Test and refine it in training before race day.");

  return { overall, calibrationQuality, notes };
}

// ─── Segment recommendations ──────────────────────────────────────────────────

function generateSegmentRecommendations(
  segments: RouteSegment[],
  athlete: AthleteProfile,
  totalRaceHours: number,
): SegmentRecommendation[] {
  return segments.map((seg) => {
    const rule = TERRAIN_RULES[seg.terrain];
    const cumulativeHours = getCumulativeTimeMinutes(segments, seg.startKm) / 60;
    const isLateRace = cumulativeHours >= (totalRaceHours * 0.6);

    let preferred = [...rule.preferred];
    const avoid = [...rule.avoid];

    if (isLateRace && !avoid.includes("real_food")) {
      avoid.push("real_food");
      preferred = preferred.filter((t) => t !== "real_food" && t !== "bar");
    }

    if (athlete.preferences.noSolids) {
      avoid.push("bar", "real_food", "chew");
      preferred = preferred.filter((t) => !["bar", "real_food", "chew"].includes(t));
    }
    if (athlete.preferences.drinkHeavy && !preferred.includes("drink_mix")) {
      preferred.unshift("drink_mix");
    }
    if (athlete.preferences.gelLight) {
      preferred = preferred.filter((t) => t !== "gel");
    }

    const primaryFuel: FuelType | "fluid_only" =
      seg.terrain === "technical_descent"
        ? "fluid_only"
        : (preferred[0] as FuelType) ?? "gel";

    const speedKmh = 60 / (seg.estimatedPaceMinPerKm || 7);
    const gradient = seg.avgGradientPct / 100;
    const kcalPerHour = caloricBurnRate(athlete.bodyweightKg, speedKmh, gradient);
    const intervalMins = fuellingIntervalMinutes(kcalPerHour);

    return {
      segmentId: seg.id,
      terrain: seg.terrain,
      terrainLabel: terrainLabel(seg.terrain),
      primaryFuelType: primaryFuel,
      avoid,
      rationale: rule.rationale,
      timingNote: isLateRace ? "Late race: stick to simple, well-tolerated options." : rule.timingNote,
      estimatedKcalPerHour: Math.round(kcalPerHour),
      fuellingFormat: isLateRace ? "Simplified \u2014 highest tolerance options only" : rule.fuellingFormat,
      derivedFuelIntervalMinutes: intervalMins,
    };
  });
}

// ─── Schedule generation ──────────────────────────────────────────────────────

function generateSchedule(
  segments: RouteSegment[],
  inventory: FuelItem[],
  aidStations: AidStation[],
  athlete: AthleteProfile,
  assumptions: PlannerAssumptions,
  totalRaceMinutes: number,
  warnings: PlanWarning[]
): FuelScheduleEntry[] {
  const schedule: FuelScheduleEntry[] = [];
  const inventoryUsage = new Map<string, number>();
  let totalCaffeineMg = 0;
  const caffeineLimitMg = athlete.caffeineMaxMg ?? 400;
  let entryIdx = 0;
  let cumulativeMinutes = 0;
  let solidCarbsSoFar = 0;
  let liquidCarbsSoFar = 0;

  for (const seg of segments) {
    const rule = TERRAIN_RULES[seg.terrain];
    const segStartMinutes = cumulativeMinutes;
    const segEndMinutes = cumulativeMinutes + seg.estimatedDurationMinutes;
    const raceHoursAtSegStart = segStartMinutes / 60;

    const segSpeedKmh = 60 / (seg.estimatedPaceMinPerKm || 7);
    const segGradient = seg.avgGradientPct / 100;
    const segKcalPerHr = caloricBurnRate(athlete.bodyweightKg, segSpeedKmh, segGradient);
    const intervalMins = fuellingIntervalMinutes(segKcalPerHr);
    const numSlots = Math.max(1, Math.floor(seg.estimatedDurationMinutes / intervalMins));

    for (let slot = 0; slot < numSlots; slot++) {
      const timeOffset = slot === 0 ? intervalMins * 0.5 : slot * intervalMins;
      const eventTimeMinutes = Math.round(segStartMinutes + timeOffset);

      if (eventTimeMinutes >= segEndMinutes) continue;

      const distanceKm = seg.startKm + (timeOffset / seg.estimatedDurationMinutes) * seg.distanceKm;

      const nearAid = aidStations.find((as) => Math.abs(as.distanceKm - distanceKm) < 1.5);

      if (seg.terrain === "technical_descent" && slot === 0) continue;

      const selectedFuel = selectBestFuel(
        inventory, inventoryUsage, seg.terrain, rule, athlete,
        raceHoursAtSegStart, totalRaceMinutes / 60, totalCaffeineMg, caffeineLimitMg,
        solidCarbsSoFar, liquidCarbsSoFar, !!nearAid,
      );

      if (!selectedFuel) {
        warnings.push({
          type: "warning",
          code: "NO_SUITABLE_FUEL",
          message: `No suitable fuel found for ${terrainLabel(seg.terrain)} at km ${distanceKm.toFixed(1)}`,
          detail: "Consider adding more fuel options to your inventory.",
        });
        continue;
      }

      const quantity = calcQuantity(selectedFuel, athlete.carbTargetPerHour, intervalMins);

      // Track solid vs liquid carb allocation for guardrail
      const entryCarbs = selectedFuel.carbsPerServing * quantity;
      if (selectedFuel.requiresChewing) {
        solidCarbsSoFar += entryCarbs;
      } else {
        liquidCarbsSoFar += entryCarbs;
      }

      totalCaffeineMg += selectedFuel.caffeinePerServingMg * quantity;
      const used = inventoryUsage.get(selectedFuel.id) ?? 0;
      inventoryUsage.set(selectedFuel.id, used + quantity);

      const fluidTarget = Math.round(
        (athlete.fluidTargetPerHourMl / 60) * intervalMins * rule.fluidPriorityMultiplier
      );

      const action = typeToAction(selectedFuel.type);

      const entry: FuelScheduleEntry = {
        id: `entry-${++entryIdx}`,
        timeMinutes: eventTimeMinutes,
        distanceKm: Math.round(distanceKm * 10) / 10,
        segmentId: seg.id,
        terrain: seg.terrain,
        action,
        fuelItemId: selectedFuel.id,
        fuelItemName: selectedFuel.productName,
        quantity,
        carbsG: Math.round(selectedFuel.carbsPerServing * quantity),
        fluidMl: fluidTarget,
        sodiumMg: Math.round(selectedFuel.sodiumPerServingMg * quantity),
        caffeinesMg: Math.round(selectedFuel.caffeinePerServingMg * quantity),
        rationale: `${terrainLabel(seg.terrain)}: ${rule.rationale}`,
        priority: slot === 0 ? "required" : "recommended",
        isNearAidStation: !!nearAid,
        warnings: buildEntryWarnings(selectedFuel, quantity, inventoryUsage, athlete, raceHoursAtSegStart),
      };

      schedule.push(entry);

      if (rule.fluidPriorityMultiplier > 1.2 && fluidTarget > 0) {
        schedule.push({
          id: `entry-${++entryIdx}-drink`,
          timeMinutes: eventTimeMinutes + 5,
          distanceKm: Math.round((distanceKm + 0.1) * 10) / 10,
          segmentId: seg.id,
          terrain: seg.terrain,
          action: "drink_fluid",
          quantity: 1,
          carbsG: 0,
          fluidMl: fluidTarget,
          sodiumMg: Math.round((athlete.sodiumTargetPerHourMg / 60) * intervalMins),
          caffeinesMg: 0,
          rationale: `High-effort terrain \u2014 stay on top of hydration. Target ${fluidTarget}ml.`,
          priority: "required",
          isNearAidStation: !!nearAid,
        });
      }

      if (nearAid && Math.abs(nearAid.distanceKm - distanceKm) < 0.5) {
        schedule.push({
          id: `entry-${++entryIdx}-aid`,
          timeMinutes: eventTimeMinutes + 1,
          distanceKm: nearAid.distanceKm,
          segmentId: seg.id,
          terrain: seg.terrain,
          action: "refill_at_aid",
          quantity: 1,
          carbsG: 0,
          fluidMl: nearAid.fullRefillPossible ? athlete.fluidTargetPerHourMl : 500,
          sodiumMg: 0,
          caffeinesMg: 0,
          rationale: `Aid station: ${nearAid.name}. ${nearAid.fullRefillPossible ? "Full refill possible." : "Partial resupply."}`,
          priority: "required",
          isNearAidStation: true,
        });
      }
    }

    cumulativeMinutes += seg.estimatedDurationMinutes;
  }

  schedule.sort((a, b) => a.timeMinutes - b.timeMinutes);
  checkInventoryExhaustion(inventory, inventoryUsage, warnings);

  return schedule;
}

// ─── Fuel selection logic ─────────────────────────────────────────────────────

function selectBestFuel(
  inventory: FuelItem[],
  usage: Map<string, number>,
  terrain: TerrainType,
  rule: TerrainRule,
  athlete: AthleteProfile,
  raceHoursNow: number,
  totalRaceHours: number,
  totalCaffeineMg: number,
  caffeineLimitMg: number,
  solidCarbsSoFar: number,
  liquidCarbsSoFar: number,
  isNearAidStation: boolean,
): FuelItem | null {
  const isLateRace = raceHoursNow >= (athlete.preferences.noSweetAfterHour ?? Infinity) ||
    raceHoursNow >= totalRaceHours * 0.65;
  const isUltra = totalRaceHours >= 6;
  const isLongUltra = totalRaceHours >= 10;
  const isHighEffort = terrain === "steep_climb" || terrain === "sustained_climb";

  const available = inventory.filter((item) => {
    const used = usage.get(item.id) ?? 0;
    if (used >= item.quantityAvailable) return false;
    if (rule.avoid.includes(item.type)) return false;
    if (athlete.preferences.noSolids && item.requiresChewing) return false;
    if (athlete.preferences.exclusions.includes(item.productName)) return false;
    if (athlete.caffeinePreference === "none" && item.caffeinePerServingMg > 0) return false;
    if (totalCaffeineMg + item.caffeinePerServingMg > caffeineLimitMg) return false;
    if (isHighEffort && item.requiresChewing) return false;
    return true;
  });

  if (available.length === 0) return null;

  // Solid carb ratio tracking for guardrail enforcement
  const totalCarbsSoFar = solidCarbsSoFar + liquidCarbsSoFar;
  const currentSolidRatio = totalCarbsSoFar > 0
    ? solidCarbsSoFar / totalCarbsSoFar : 0;
  // Cap: 25% solid by default, 40% if low-sweetness tolerance, 0% if noSolids
  const solidCapRatio = athlete.preferences.noSolids ? 0
    : athlete.preferences.lowSweetnessTolerance ? 0.40
    : 0.25;

  const scored = available.map((item) => {
    let score = 0;
    const isSolid = item.requiresChewing;

    // 1. Terrain suitability (from TERRAIN_RULES preferred list)
    const prefIdx = rule.preferred.indexOf(item.type);
    if (prefIdx === 0) score += 20;
    else if (prefIdx === 1) score += 15;
    else if (prefIdx > 1) score += 8;

    // 2. Race-distance format bias — for ultras, strongly favour gels/drinks
    if (isLongUltra) {
      score += isSolid ? -20 : 25;
    } else if (isUltra) {
      score += isSolid ? -10 : 15;
    }

    // 3. Effort-based scoring
    if (isHighEffort) {
      if (item.easyAtHighEffort) score += 15;
      if (isSolid) score -= 15;
    }

    // 4. Late-race tolerance
    if (isLateRace) {
      score += item.lateRaceToleranceScore * 8;
      if (isSolid) score -= 12;
    } else {
      score += (6 - item.sweetnessScore) * 2;
    }

    // 5. Sweetness fatigue management
    if (athlete.preferences.lowSweetnessTolerance) {
      if (item.sweetnessScore <= 2) score += 12;
      if (isSolid) score += 8; // low-sweetness runners may prefer less-sweet solids
    }
    if (raceHoursNow > 6 && item.sweetnessScore >= 4) score -= 5;

    // 6. Carry efficiency — dense carb sources score higher
    if (!isSolid && item.carbsPerServing >= 25) score += 5;

    // 7. Hydration contribution
    if (item.fluidContributionMl > 0) score += 3;

    // 8. User preferences
    if (athlete.preferences.drinkHeavy && item.type === "drink_mix") score += 20;
    if (athlete.preferences.gelLight && item.type === "gel") score -= 15;

    // 9. Solid cap guardrail — strongly penalise solids when ratio exceeds cap
    if (isSolid && totalCarbsSoFar > 50 && currentSolidRatio >= solidCapRatio) {
      score -= 30;
    }

    // 10. Aid station proximity — solids more acceptable near aid stations
    if (isNearAidStation && isSolid && !isLateRace && !isHighEffort) {
      score += 10;
    }

    // 11. Supply management — deprioritise items running low
    const used = usage.get(item.id) ?? 0;
    const remaining = item.quantityAvailable - used;
    if (remaining <= 2) score -= 20;

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.item ?? null;
}

function calcQuantity(item: FuelItem, carbTargetPerHour: number, intervalMins: number): number {
  const carbTargetForInterval = (carbTargetPerHour / 60) * intervalMins;
  const servings = Math.round(carbTargetForInterval / item.carbsPerServing);
  return Math.max(1, Math.min(servings, 3));
}

// ─── Carry plan generation ────────────────────────────────────────────────────

function generateCarryPlans(
  segments: RouteSegment[], aidStations: AidStation[], schedule: FuelScheduleEntry[],
  inventory: FuelItem[], athlete: AthleteProfile, assumptions: PlannerAssumptions
): CarryPlan[] {
  if (aidStations.length === 0) {
    return [buildCarryPlan("Start", "Finish", 0, segments, schedule, inventory, athlete)];
  }
  const checkpoints = [
    { name: "Start", km: 0 },
    ...aidStations.map((a) => ({ name: a.name, km: a.distanceKm })),
    { name: "Finish", km: segments[segments.length - 1]?.endKm ?? 0 },
  ];
  const plans: CarryPlan[] = [];
  for (let i = 0; i < checkpoints.length - 1; i++) {
    const from = checkpoints[i];
    const to = checkpoints[i + 1];
    const segsInSection = segments.filter((s) => s.endKm > from.km && s.startKm < to.km);
    const sectionSchedule = schedule.filter((e) => e.distanceKm > from.km && e.distanceKm <= to.km);
    plans.push(buildCarryPlan(from.name, to.name, from.km, segsInSection, sectionSchedule, inventory, athlete));
  }
  return plans;
}

function buildCarryPlan(
  fromLabel: string, toLabel: string, fromKm: number,
  segs: RouteSegment[], sectionSchedule: FuelScheduleEntry[],
  inventory: FuelItem[], athlete: AthleteProfile
): CarryPlan {
  const toKm = segs[segs.length - 1]?.endKm ?? fromKm;
  const durationMins = segs.reduce((a, s) => a + s.estimatedDurationMinutes, 0);
  const durationHours = durationMins / 60;

  const totalFluid = Math.round(athlete.fluidTargetPerHourMl * durationHours);
  const totalCarbs = Math.round(athlete.carbTargetPerHour * durationHours);

  const itemMap = new Map<string, { name: string; qty: number; carbs: number }>();
  for (const entry of sectionSchedule) {
    if (!entry.fuelItemId || !entry.fuelItemName) continue;
    const existing = itemMap.get(entry.fuelItemId);
    if (existing) {
      existing.qty += entry.quantity;
      existing.carbs += entry.carbsG;
    } else {
      itemMap.set(entry.fuelItemId, { name: entry.fuelItemName, qty: entry.quantity, carbs: entry.carbsG });
    }
  }

  const items: CarryItem[] = Array.from(itemMap.entries()).map(
    ([id, v]) => ({ fuelItemId: id, fuelItemName: v.name, quantity: v.qty, carbsG: v.carbs })
  );

  const warnings: string[] = [];
  if (totalFluid > 1500) {
    warnings.push(`${(totalFluid / 1000).toFixed(1)}L of fluid to carry \u2014 consider resupply strategy.`);
  }

  return {
    sectionId: `${fromKm}-${toKm}`, fromKm, toKm, fromLabel, toLabel,
    estimatedDurationMinutes: durationMins, fluidToCarryMl: totalFluid,
    carbsToCarryG: totalCarbs, itemsToCarry: items, warnings,
  };
}

// ─── Plan summary ─────────────────────────────────────────────────────────────

function buildSummary(
  schedule: FuelScheduleEntry[], inventory: FuelItem[],
  totalRaceMinutes: number, athlete: AthleteProfile,
  segments: RouteSegment[], avgKcalPerHour: number,
  calibration: CalibrationResult,
): PlanSummary {
  const totalRaceHours = totalRaceMinutes / 60;

  const fuelEvents = schedule.filter((e) => e.action !== "refill_at_aid" && e.action !== "restock_carry");

  const totalCarbsG = fuelEvents.reduce((a, e) => a + e.carbsG, 0);
  const totalFluidMl = schedule.reduce((a, e) => a + e.fluidMl, 0);
  const totalSodiumMg = schedule.reduce((a, e) => a + e.sodiumMg, 0);
  const totalCaffeineMg = fuelEvents.reduce((a, e) => a + e.caffeinesMg, 0);

  const itemTotals: Record<string, { name: string; quantity: number; carbsG: number }> = {};
  for (const entry of fuelEvents) {
    if (!entry.fuelItemId || !entry.fuelItemName) continue;
    const ex = itemTotals[entry.fuelItemId];
    if (ex) { ex.quantity += entry.quantity; ex.carbsG += entry.carbsG; }
    else { itemTotals[entry.fuelItemId] = { name: entry.fuelItemName, quantity: entry.quantity, carbsG: entry.carbsG }; }
  }

  const avgCarbsPerHour = totalRaceHours > 0 ? Math.round(totalCarbsG / totalRaceHours) : 0;
  const targetCoverageRatio = athlete.carbTargetPerHour > 0 ? avgCarbsPerHour / athlete.carbTargetPerHour : 1;
  const coverageScore = Math.min(100, Math.round(targetCoverageRatio * 100));

  // ── Generate fuel format notes for transparency ───────────────────────
  const fuelFormatNotes: string[] = [];

  const solidCarbs = fuelEvents.reduce((acc, e) => {
    const item = inventory.find(f => f.id === e.fuelItemId);
    return acc + (item?.requiresChewing ? e.carbsG : 0);
  }, 0);
  const solidPct = totalCarbsG > 0 ? Math.round(solidCarbs / totalCarbsG * 100) : 0;

  if (totalRaceHours >= 8) {
    if (solidPct <= 30) {
      fuelFormatNotes.push(
        `Gel and drink-dominant plan (${100 - solidPct}% of carbs from liquids/gels). Recommended for long ultras to minimise gut stress.`
      );
    } else if (solidPct <= 45) {
      fuelFormatNotes.push(
        `Mixed format plan: ${solidPct}% of carbs from solid foods, ${100 - solidPct}% from gels/drinks. Solids are scheduled on easier terrain.`
      );
    } else {
      fuelFormatNotes.push(
        `Solid-heavy plan (${solidPct}% from solids). For races over 8 hours, consider shifting more toward gels and drinks for better absorption.`
      );
    }
  } else if (totalRaceHours >= 3) {
    if (solidPct > 50) {
      fuelFormatNotes.push(
        `Mixed format with ${solidPct}% solid foods. This works well for shorter events with accessible terrain.`
      );
    }
  }

  // Top fuel types breakdown
  const typeCarbTotals: Record<string, number> = {};
  for (const e of fuelEvents) {
    const item = inventory.find(f => f.id === e.fuelItemId);
    if (item) {
      typeCarbTotals[item.type] = (typeCarbTotals[item.type] ?? 0) + e.carbsG;
    }
  }
  const sortedTypes = Object.entries(typeCarbTotals).sort(([, a], [, b]) => b - a);
  if (sortedTypes.length > 0 && totalCarbsG > 0) {
    const typeLabels: Record<string, string> = {
      gel: "Gels", chew: "Chews", drink_mix: "Drink mix", bar: "Bars",
      real_food: "Real food", capsule: "Capsules", other: "Other",
    };
    const topFormats = sortedTypes.slice(0, 3).map(([type, carbs]) => {
      const pct = Math.round(carbs / totalCarbsG * 100);
      return `${typeLabels[type] ?? type} (${pct}%)`;
    }).join(", ");
    fuelFormatNotes.push(`Carb sources: ${topFormats}.`);
  }

  if (segments.length > 0) {
    fuelFormatNotes.push(
      "Solids are scheduled on flat and recovery terrain where gut tolerance is highest. Gels and drinks are prioritised on climbs and in later race stages."
    );
  }

  return {
    totalRaceDurationMinutes: totalRaceMinutes,
    avgCarbsPerHour,
    avgFluidPerHourMl: totalRaceHours > 0 ? Math.round(totalFluidMl / totalRaceHours) : 0,
    avgSodiumPerHourMg: totalRaceHours > 0 ? Math.round(totalSodiumMg / totalRaceHours) : 0,
    totalCarbsG, totalFluidMl, totalSodiumMg, totalCaffeinesMg: totalCaffeineMg,
    itemTotals, coverageScore,
    estimatedTotalKcal: Math.round(avgKcalPerHour * totalRaceHours),
    avgKcalPerHour: Math.round(avgKcalPerHour),
    carbTargetRangeGPerHour: calibration.suggestedCarbRangeGPerHour,
    workingCarbTarget: calibration.workingCarbTargetGPerHour,
    burnRateBand: calibration.burnRateBand,
    fuelFormatNotes,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateInventory(inventory: FuelItem[], athlete: AthleteProfile, totalRaceHours: number, warnings: PlanWarning[]) {
  if (inventory.length === 0) {
    warnings.push({ type: "error", code: "NO_INVENTORY", message: "No fuel items added.", detail: "Add at least one fuel item to generate a plan." });
    return;
  }
  const totalCarbsAvailable = inventory.reduce((a, item) => a + item.carbsPerServing * item.quantityAvailable, 0);
  const totalCarbsNeeded = athlete.carbTargetPerHour * totalRaceHours;
  if (totalCarbsAvailable < totalCarbsNeeded * 0.8) {
    warnings.push({
      type: "warning", code: "INSUFFICIENT_CARBS",
      message: `Inventory may be insufficient: ${Math.round(totalCarbsAvailable)}g available vs ${Math.round(totalCarbsNeeded)}g needed.`,
      detail: "Consider adding more items or increasing quantities.",
    });
  }
  if (athlete.carbTargetPerHour > athlete.maxCarbsPerHour) {
    warnings.push({
      type: "error", code: "CARB_TARGET_EXCEEDS_TOLERANCE",
      message: `Carb target (${athlete.carbTargetPerHour}g/hr) exceeds tolerance limit (${athlete.maxCarbsPerHour}g/hr).`,
    });
  }
  if (athlete.carbTargetPerHour > 90) {
    warnings.push({
      type: "info", code: "HIGH_CARB_TARGET",
      message: `${athlete.carbTargetPerHour}g/hr is a high carb target \u2014 requires mixed carb sources and gut training.`,
    });
  }
}

function checkInventoryExhaustion(inventory: FuelItem[], usage: Map<string, number>, warnings: PlanWarning[]) {
  for (const item of inventory) {
    const used = usage.get(item.id) ?? 0;
    if (used > item.quantityAvailable) {
      warnings.push({
        type: "warning", code: "ITEM_EXHAUSTED",
        message: `${item.productName}: plan uses ${used} but you only have ${item.quantityAvailable}.`,
        detail: "Increase quantity or ensure resupply at aid stations.",
      });
    }
  }
}

function buildEntryWarnings(item: FuelItem, quantity: number, usage: Map<string, number>, athlete: AthleteProfile, raceHoursNow: number): string[] {
  const ws: string[] = [];
  const used = usage.get(item.id) ?? 0;
  const remaining = item.quantityAvailable - used;
  if (remaining <= 3) ws.push(`Low supply: only ${remaining} left.`);
  if (athlete.preferences.noSweetAfterHour && raceHoursNow >= athlete.preferences.noSweetAfterHour && item.sweetnessScore >= 4) {
    ws.push(`Sweet item after hour ${athlete.preferences.noSweetAfterHour} \u2014 may cause nausea.`);
  }
  return ws;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeToAction(type: FuelType): FuelAction {
  const map: Record<FuelType, FuelAction> = {
    gel: "consume_gel", chew: "consume_chew", bar: "consume_bar",
    real_food: "consume_food", drink_mix: "drink_fluid", capsule: "take_capsule", other: "consume_food",
  };
  return map[type] ?? "consume_gel";
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
