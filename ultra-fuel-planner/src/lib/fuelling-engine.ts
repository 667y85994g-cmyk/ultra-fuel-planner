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
} from "@/types";
import { getCumulativeTimeMinutes, terrainLabel } from "./segmentation";
import {
  caloricBurnRate,
  fuellingIntervalMinutes,
  derivedCarbGPerHour,
  choBurnRateGPerHour,
  choFraction,
  INTENSITY_VO2MAX,
  FUEL_TRIGGER_KCAL,
  type RaceIntensity,
  type FatAdaptation,
} from "./energy-model";

// ─── Terrain-based fuelling rules ─────────────────────────────────────────────

interface TerrainRule {
  preferred: FuelType[];
  avoid: FuelType[];
  rationale: string;
  timingNote?: string;
  fluidPriorityMultiplier: number; // >1 = push fluids more
}

const TERRAIN_RULES: Record<TerrainType, TerrainRule> = {
  steep_climb: {
    preferred: ["drink_mix", "gel"],
    avoid: ["bar", "chew", "real_food"],
    rationale:
      "Steep climb: breathing is heavy, chewing is impractical. Stick to fluids and gels you can take without breaking stride.",
    timingNote: "Fuel just before the climb starts when possible.",
    fluidPriorityMultiplier: 1.4,
  },
  sustained_climb: {
    preferred: ["drink_mix", "gel"],
    avoid: ["bar", "real_food"],
    rationale:
      "Sustained climb: elevated effort makes solid food harder to process. Prefer drink mix and gels.",
    timingNote: "Fuel early in the climb, not at the steepest point.",
    fluidPriorityMultiplier: 1.25,
  },
  rolling: {
    preferred: ["chew", "gel", "drink_mix"],
    avoid: [],
    rationale:
      "Rolling terrain: mixed effort allows most fuel formats. Chews work well on the runnable sections.",
    fluidPriorityMultiplier: 1.0,
  },
  flat_runnable: {
    preferred: ["chew", "bar", "gel", "drink_mix", "real_food"],
    avoid: [],
    rationale:
      "Flat and runnable: best opportunity to eat solids or chews. Take bars and real food here.",
    timingNote: "Ideal time to eat anything that requires chewing.",
    fluidPriorityMultiplier: 0.9,
  },
  technical_descent: {
    preferred: ["drink_mix"],
    avoid: ["bar", "chew", "real_food", "gel"],
    rationale:
      "Technical descent: concentration required, hands may be needed for balance. Avoid fiddly fuelling — schedule just before or after.",
    timingNote: "Fuel at the bottom or top of this descent, not during.",
    fluidPriorityMultiplier: 0.8,
  },
  runnable_descent: {
    preferred: ["drink_mix", "gel"],
    avoid: ["bar", "real_food"],
    rationale:
      "Runnable descent: good pace possible but still avoid solid food that disrupts breathing.",
    fluidPriorityMultiplier: 0.9,
  },
  recovery: {
    preferred: ["bar", "real_food", "chew", "drink_mix"],
    avoid: [],
    rationale:
      "Recovery section: easy effort is a good window to eat real food and restore energy stores.",
    fluidPriorityMultiplier: 0.85,
  },
};

// ─── Energy-model-driven target derivation ────────────────────────────────────

/**
 * Uses the Minetti / Brooks-Mercier energy model to calculate:
 *   1. Weighted-average caloric burn rate across all route segments
 *   2. Derived carb target (g/hr) from the 300 kcal / 25 g fuelling rule
 *   3. Fluid target override if sweat rate data is provided
 *
 * If raceIntensity is not set, falls back to the athlete's manually-entered
 * carbTargetPerHour and fluidTargetPerHourMl unchanged.
 */
function deriveEnergyTargets(
  athlete: AthleteProfile,
  segments: RouteSegment[],
  warnings: PlanWarning[],
): { effectiveAthlete: AthleteProfile; avgKcalPerHour: number | undefined } {
  const m = athlete.trainingMetrics;

  // Sweat-rate fluid adjustment (independent of energy model)
  let derivedFluid = athlete.fluidTargetPerHourMl;
  if (
    m?.hydrationLossEstimateMlPerHour &&
    m.hydrationLossEstimateMlPerHour > athlete.fluidTargetPerHourMl
  ) {
    derivedFluid = Math.min(1200, m.hydrationLossEstimateMlPerHour);
    warnings.push({
      type: "info",
      code: "SWEAT_FLUID_ADJUSTED",
      message: `Fluid target set to ${derivedFluid} ml/hr based on your sweat rate data.`,
    });
  }

  if (!m?.raceIntensity) {
    // No energy model inputs — use manual targets
    const updated = derivedFluid !== athlete.fluidTargetPerHourMl
      ? { ...athlete, fluidTargetPerHourMl: derivedFluid }
      : athlete;
    return { effectiveAthlete: updated, avgKcalPerHour: undefined };
  }

  const intensityFraction = INTENSITY_VO2MAX[m.raceIntensity as RaceIntensity];
  const fatAdaptation     = (m.fatAdaptation ?? "low") as FatAdaptation;

  // Calculate weighted-average kcal/hr from route segments.
  // Each segment contributes proportionally to its estimated duration.
  let avgKcalPerHour: number;
  if (segments.length > 0) {
    const totalMins = segments.reduce((a, s) => a + s.estimatedDurationMinutes, 0);
    const weightedKcal = segments.reduce((acc, seg) => {
      const speedKmh = 60 / (seg.estimatedPaceMinPerKm || 7);
      const gradient  = seg.avgGradientPct / 100;
      const kcalHr    = caloricBurnRate(athlete.bodyweightKg, speedKmh, gradient);
      return acc + kcalHr * seg.estimatedDurationMinutes;
    }, 0);
    avgKcalPerHour = totalMins > 0 ? weightedKcal / totalMins : 500;
  } else {
    // No route: flat estimate at 7 min/km (moderate ultra pace)
    avgKcalPerHour = caloricBurnRate(athlete.bodyweightKg, 60 / 7, 0);
  }

  // Derived carb target from the 300 kcal / 25 g rule, capped at gut tolerance
  const derived = derivedCarbGPerHour(avgKcalPerHour);
  const carbTarget = Math.min(athlete.maxCarbsPerHour, derived);

  // CHO burn rate (endogenous) — for informational warnings
  const choBurnG = choBurnRateGPerHour(avgKcalPerHour, intensityFraction, fatAdaptation);

  warnings.push({
    type: "info",
    code: "ENERGY_MODEL_ACTIVE",
    message:
      `Energy model: ~${Math.round(avgKcalPerHour)} kcal/hr estimated burn rate ` +
      `(${m.raceIntensity} effort, ${m.fatAdaptation ?? "low"} fat adaptation). ` +
      `Endogenous CHO burn: ~${choBurnG} g/hr. ` +
      `Exogenous carb target: ${carbTarget} g/hr (fuel every ~${fuellingIntervalMinutes(avgKcalPerHour)} min).`,
  });

  if (derived > athlete.maxCarbsPerHour) {
    warnings.push({
      type: "info",
      code: "CARB_TARGET_CAPPED",
      message: `Calculated carb need (${derived} g/hr) exceeds your gut tolerance ceiling (${athlete.maxCarbsPerHour} g/hr) — target capped. Consider gut training to increase absorption.`,
    });
  }

  return {
    effectiveAthlete: {
      ...athlete,
      carbTargetPerHour: carbTarget,
      fluidTargetPerHourMl: derivedFluid,
    },
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

  // Derive calorie-model targets (may override carbTargetPerHour)
  const { effectiveAthlete: athlete, avgKcalPerHour } = deriveEnergyTargets(
    plan.athlete,
    segments,
    warnings,
  );

  const totalRaceMinutes = segments.reduce(
    (acc, s) => acc + s.estimatedDurationMinutes,
    0
  );
  const totalRaceHours = totalRaceMinutes / 60;

  // Validate inventory against targets
  validateInventory(fuelInventory, athlete, totalRaceHours, warnings);

  // Generate segment recommendations (includes per-segment kcal data)
  const segmentRecommendations = generateSegmentRecommendations(
    segments,
    athlete,
    totalRaceHours,
  );

  // Generate hourly schedule (intervals driven by energy model)
  const schedule = generateSchedule(
    segments,
    fuelInventory,
    aidStations,
    athlete,
    assumptions,
    totalRaceMinutes,
    warnings
  );

  // Generate carry plans
  const carryPlans = generateCarryPlans(
    segments,
    aidStations,
    schedule,
    fuelInventory,
    athlete,
    assumptions
  );

  // Build summary (includes kcal data if energy model active)
  const summary = buildSummary(
    schedule,
    fuelInventory,
    totalRaceMinutes,
    athlete,
    segments,
    avgKcalPerHour,
  );

  return {
    eventPlan: { ...plan, athlete },   // store effective athlete (with derived targets)
    summary,
    schedule,
    carryPlans,
    segmentRecommendations,
    warnings,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Segment recommendations ──────────────────────────────────────────────────

function generateSegmentRecommendations(
  segments: RouteSegment[],
  athlete: AthleteProfile,
  totalRaceHours: number,
): SegmentRecommendation[] {
  const m = athlete.trainingMetrics;
  const intensityFraction = m?.raceIntensity
    ? INTENSITY_VO2MAX[m.raceIntensity as RaceIntensity]
    : undefined;
  const fatAdaptation = (m?.fatAdaptation ?? "low") as FatAdaptation;

  return segments.map((seg) => {
    const rule = TERRAIN_RULES[seg.terrain];
    const cumulativeHours = getCumulativeTimeMinutes(segments, seg.startKm) / 60;
    const isLateRace = cumulativeHours >= (totalRaceHours * 0.6);

    let preferred = [...rule.preferred];
    const avoid = [...rule.avoid];

    // Late race adjustments
    if (isLateRace && !avoid.includes("real_food")) {
      avoid.push("real_food");
      preferred = preferred.filter((t) => t !== "real_food" && t !== "bar");
    }

    // Athlete preference adjustments
    if (athlete.preferences.noSolids) {
      avoid.push("bar", "real_food", "chew");
      preferred = preferred.filter(
        (t) => !["bar", "real_food", "chew"].includes(t)
      );
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

    // Per-segment energy model outputs
    const speedKmh = 60 / (seg.estimatedPaceMinPerKm || 7);
    const gradient  = seg.avgGradientPct / 100;
    const kcalPerHour = caloricBurnRate(athlete.bodyweightKg, speedKmh, gradient);
    const intervalMins = fuellingIntervalMinutes(kcalPerHour);
    const choBurnG = intensityFraction
      ? choBurnRateGPerHour(kcalPerHour, intensityFraction, fatAdaptation)
      : undefined;

    return {
      segmentId: seg.id,
      terrain: seg.terrain,
      terrainLabel: terrainLabel(seg.terrain),
      primaryFuelType: primaryFuel,
      avoid,
      rationale: rule.rationale,
      timingNote: rule.timingNote,
      estimatedKcalPerHour: Math.round(kcalPerHour),
      choBurnGPerHour: choBurnG,
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
  const inventoryUsage = new Map<string, number>(); // id -> servings used
  let totalCaffeineMg = 0;
  const caffeineLimitMg = athlete.caffeineMaxMg ?? 400;

  // Build fuelling slots every ~20 minutes, adjusted per terrain
  let entryIdx = 0;

  let cumulativeMinutes = 0;
  for (const seg of segments) {
    const rule = TERRAIN_RULES[seg.terrain];
    const segStartMinutes = cumulativeMinutes;
    const segEndMinutes = cumulativeMinutes + seg.estimatedDurationMinutes;
    const raceHoursAtSegStart = segStartMinutes / 60;

    // Calorie-model-driven fuelling interval for this segment
    const segSpeedKmh = 60 / (seg.estimatedPaceMinPerKm || 7);
    const segGradient  = seg.avgGradientPct / 100;
    const segKcalPerHr = caloricBurnRate(athlete.bodyweightKg, segSpeedKmh, segGradient);
    const intervalMins = fuellingIntervalMinutes(segKcalPerHr);
    const numSlots = Math.max(1, Math.floor(seg.estimatedDurationMinutes / intervalMins));

    for (let slot = 0; slot < numSlots; slot++) {
      const timeOffset = slot === 0 ? intervalMins * 0.5 : slot * intervalMins;
      const eventTimeMinutes = Math.round(segStartMinutes + timeOffset);

      if (eventTimeMinutes >= segEndMinutes) continue;

      const distanceKm =
        seg.startKm +
        (timeOffset / seg.estimatedDurationMinutes) * seg.distanceKm;

      // Is this near an aid station?
      const nearAid = aidStations.find(
        (as) => Math.abs(as.distanceKm - distanceKm) < 1.5
      );

      // Should we fuel here?
      if (seg.terrain === "technical_descent" && slot === 0) {
        // Skip fuelling at the start of technical descent
        continue;
      }

      // Select best fuel item
      const selectedFuel = selectBestFuel(
        inventory,
        inventoryUsage,
        seg.terrain,
        rule,
        athlete,
        raceHoursAtSegStart,
        totalRaceMinutes / 60,
        totalCaffeineMg,
        caffeineLimitMg
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

      const quantity = calcQuantity(
        selectedFuel,
        athlete.carbTargetPerHour,
        intervalMins
      );

      // Track caffeine
      totalCaffeineMg += selectedFuel.caffeinePerServingMg * quantity;

      // Track usage
      const used = inventoryUsage.get(selectedFuel.id) ?? 0;
      inventoryUsage.set(selectedFuel.id, used + quantity);

      // Fluid target (adjusted for terrain)
      const fluidTarget = Math.round(
        (athlete.fluidTargetPerHourMl / 60) *
          intervalMins *
          rule.fluidPriorityMultiplier
      );

      const action = typeToAction(selectedFuel.type);
      const rationalePrefix = `${terrainLabel(seg.terrain)}: `;

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
        rationale: rationalePrefix + rule.rationale,
        priority: slot === 0 ? "required" : "recommended",
        isNearAidStation: !!nearAid,
        warnings: buildEntryWarnings(
          selectedFuel,
          quantity,
          inventoryUsage,
          athlete,
          raceHoursAtSegStart
        ),
      };

      schedule.push(entry);

      // Add a separate "drink" event if we're on a climb and fluid priority is high
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
          rationale: `High-effort terrain — stay on top of hydration. Target ${fluidTarget}ml.`,
          priority: "required",
          isNearAidStation: !!nearAid,
        });
      }

      // Aid station event
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

  // Sort by time
  schedule.sort((a, b) => a.timeMinutes - b.timeMinutes);

  // Check inventory exhaustion
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
  caffeineLimitMg: number
): FuelItem | null {
  const isLateRace = raceHoursNow >= athlete.preferences.noSweetAfterHour! ||
    raceHoursNow >= totalRaceHours * 0.65;

  // Filter to available items
  const available = inventory.filter((item) => {
    const used = usage.get(item.id) ?? 0;
    if (used >= item.quantityAvailable) return false;
    if (rule.avoid.includes(item.type)) return false;
    if (athlete.preferences.noSolids && item.requiresChewing) return false;
    if (athlete.preferences.exclusions.includes(item.productName)) return false;
    if (
      athlete.caffeinePreference === "none" &&
      item.caffeinePerServingMg > 0
    )
      return false;
    if (totalCaffeineMg + item.caffeinePerServingMg > caffeineLimitMg)
      return false;
    // Terrain-specific filters
    const isClimb =
      terrain === "steep_climb" || terrain === "sustained_climb";
    if (isClimb && item.requiresChewing) return false;
    return true;
  });

  if (available.length === 0) return null;

  // Score each item
  const scored = available.map((item) => {
    let score = 0;

    // Preferred type bonus
    const prefIdx = rule.preferred.indexOf(item.type);
    if (prefIdx === 0) score += 30;
    else if (prefIdx === 1) score += 20;
    else if (prefIdx > 1) score += 10;

    // Late race tolerance
    if (isLateRace) score += item.lateRaceToleranceScore * 8;
    else score += (6 - item.sweetnessScore) * 3; // earlier: less sweet can be good variety

    // Athlete preferences
    if (athlete.preferences.drinkHeavy && item.type === "drink_mix") score += 20;
    if (athlete.preferences.gelLight && item.type === "gel") score -= 15;

    // Effort-appropriate
    const isHigh = ["steep_climb", "sustained_climb"].includes(terrain);
    if (isHigh && item.easyAtHighEffort) score += 15;

    // Carb density (prefer items that hit the target efficiently)
    if (item.carbsPerServing >= 20) score += 5;

    // Availability remaining (don't over-rely on one item)
    const used = usage.get(item.id) ?? 0;
    const remaining = item.quantityAvailable - used;
    if (remaining <= 2) score -= 20; // conserve scarce items

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.item ?? null;
}

// ─── Quantity calculation ─────────────────────────────────────────────────────

function calcQuantity(
  item: FuelItem,
  carbTargetPerHour: number,
  intervalMins: number
): number {
  const carbTargetForInterval = (carbTargetPerHour / 60) * intervalMins;
  const servings = Math.round(carbTargetForInterval / item.carbsPerServing);
  return Math.max(1, Math.min(servings, 3)); // never more than 3 servings at once
}


// ─── Carry plan generation ────────────────────────────────────────────────────

function generateCarryPlans(
  segments: RouteSegment[],
  aidStations: AidStation[],
  schedule: FuelScheduleEntry[],
  inventory: FuelItem[],
  athlete: AthleteProfile,
  assumptions: PlannerAssumptions
): CarryPlan[] {
  if (aidStations.length === 0) {
    // No aid stations — one carry plan for the whole race
    return [buildCarryPlan("Start", "Finish", 0, segments, schedule, inventory, athlete, assumptions)];
  }

  const checkpoints = [
    { name: "Start", km: 0 },
    ...aidStations.map((a) => ({ name: a.name, km: a.distanceKm })),
    {
      name: "Finish",
      km: segments[segments.length - 1]?.endKm ?? 0,
    },
  ];

  const plans: CarryPlan[] = [];
  for (let i = 0; i < checkpoints.length - 1; i++) {
    const from = checkpoints[i];
    const to = checkpoints[i + 1];
    const segsInSection = segments.filter(
      (s) => s.endKm > from.km && s.startKm < to.km
    );
    const sectionSchedule = schedule.filter(
      (e) => e.distanceKm > from.km && e.distanceKm <= to.km
    );

    plans.push(
      buildCarryPlan(
        from.name,
        to.name,
        from.km,
        segsInSection,
        sectionSchedule,
        inventory,
        athlete,
        assumptions
      )
    );
  }

  return plans;
}

function buildCarryPlan(
  fromLabel: string,
  toLabel: string,
  fromKm: number,
  segs: RouteSegment[],
  sectionSchedule: FuelScheduleEntry[],
  inventory: FuelItem[],
  athlete: AthleteProfile,
  assumptions: PlannerAssumptions
): CarryPlan {
  const toKm = segs[segs.length - 1]?.endKm ?? fromKm;
  const durationMins = segs.reduce((a, s) => a + s.estimatedDurationMinutes, 0);
  const durationHours = durationMins / 60;

  const totalFluid = Math.round(athlete.fluidTargetPerHourMl * durationHours);
  const totalCarbs = Math.round(athlete.carbTargetPerHour * durationHours);

  // Tally items from schedule
  const itemMap = new Map<string, { name: string; qty: number; carbs: number }>();
  for (const entry of sectionSchedule) {
    if (!entry.fuelItemId || !entry.fuelItemName) continue;
    const existing = itemMap.get(entry.fuelItemId);
    if (existing) {
      existing.qty += entry.quantity;
      existing.carbs += entry.carbsG;
    } else {
      itemMap.set(entry.fuelItemId, {
        name: entry.fuelItemName,
        qty: entry.quantity,
        carbs: entry.carbsG,
      });
    }
  }

  const items: CarryItem[] = Array.from(itemMap.entries()).map(
    ([id, v]) => ({
      fuelItemId: id,
      fuelItemName: v.name,
      quantity: v.qty,
      carbsG: v.carbs,
    })
  );

  const warnings: string[] = [];
  if (totalFluid > 1500) {
    warnings.push(
      `${(totalFluid / 1000).toFixed(1)}L of fluid to carry — consider resupply strategy.`
    );
  }

  return {
    sectionId: `${fromKm}-${toKm}`,
    fromKm,
    toKm,
    fromLabel,
    toLabel,
    estimatedDurationMinutes: durationMins,
    fluidToCarryMl: totalFluid,
    carbsToCarryG: totalCarbs,
    itemsToCarry: items,
    warnings,
  };
}

// ─── Plan summary ─────────────────────────────────────────────────────────────

function buildSummary(
  schedule: FuelScheduleEntry[],
  inventory: FuelItem[],
  totalRaceMinutes: number,
  athlete: AthleteProfile,
  segments: RouteSegment[],
  avgKcalPerHour: number | undefined,
): PlanSummary {
  const totalRaceHours = totalRaceMinutes / 60;

  const fuelEvents = schedule.filter(
    (e) => e.action !== "refill_at_aid" && e.action !== "restock_carry"
  );

  const totalCarbsG = fuelEvents.reduce((a, e) => a + e.carbsG, 0);
  const totalFluidMl = schedule.reduce((a, e) => a + e.fluidMl, 0);
  const totalSodiumMg = schedule.reduce((a, e) => a + e.sodiumMg, 0);
  const totalCaffeineMg = fuelEvents.reduce((a, e) => a + e.caffeinesMg, 0);

  // Per item tallies
  const itemTotals: Record<string, { name: string; quantity: number; carbsG: number }> =
    {};
  for (const entry of fuelEvents) {
    if (!entry.fuelItemId || !entry.fuelItemName) continue;
    const ex = itemTotals[entry.fuelItemId];
    if (ex) {
      ex.quantity += entry.quantity;
      ex.carbsG += entry.carbsG;
    } else {
      itemTotals[entry.fuelItemId] = {
        name: entry.fuelItemName,
        quantity: entry.quantity,
        carbsG: entry.carbsG,
      };
    }
  }

  const avgCarbsPerHour =
    totalRaceHours > 0 ? Math.round(totalCarbsG / totalRaceHours) : 0;
  const targetCoverageRatio =
    athlete.carbTargetPerHour > 0
      ? avgCarbsPerHour / athlete.carbTargetPerHour
      : 1;
  const coverageScore = Math.min(100, Math.round(targetCoverageRatio * 100));

  // Energy model summary fields
  const m = athlete.trainingMetrics;
  let estimatedTotalKcal: number | undefined;
  let avgKcalHr: number | undefined;
  let avgChoBurnGPerHour: number | undefined;

  if (avgKcalPerHour !== undefined && m?.raceIntensity) {
    avgKcalHr = Math.round(avgKcalPerHour);
    estimatedTotalKcal = Math.round(avgKcalPerHour * totalRaceHours);
    const intensityFraction = INTENSITY_VO2MAX[m.raceIntensity as RaceIntensity];
    const fatAdaptation = (m.fatAdaptation ?? "low") as FatAdaptation;
    avgChoBurnGPerHour = choBurnRateGPerHour(avgKcalPerHour, intensityFraction, fatAdaptation);
  }

  return {
    totalRaceDurationMinutes: totalRaceMinutes,
    avgCarbsPerHour,
    avgFluidPerHourMl: totalRaceHours > 0 ? Math.round(totalFluidMl / totalRaceHours) : 0,
    avgSodiumPerHourMg: totalRaceHours > 0 ? Math.round(totalSodiumMg / totalRaceHours) : 0,
    totalCarbsG,
    totalFluidMl,
    totalSodiumMg,
    totalCaffeinesMg: totalCaffeineMg,
    itemTotals,
    coverageScore,
    estimatedTotalKcal,
    avgKcalPerHour: avgKcalHr,
    avgChoBurnGPerHour,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateInventory(
  inventory: FuelItem[],
  athlete: AthleteProfile,
  totalRaceHours: number,
  warnings: PlanWarning[]
) {
  if (inventory.length === 0) {
    warnings.push({
      type: "error",
      code: "NO_INVENTORY",
      message: "No fuel items added.",
      detail: "Add at least one fuel item to generate a plan.",
    });
    return;
  }

  const totalCarbsAvailable = inventory.reduce(
    (a, item) => a + item.carbsPerServing * item.quantityAvailable,
    0
  );
  const totalCarbsNeeded = athlete.carbTargetPerHour * totalRaceHours;

  if (totalCarbsAvailable < totalCarbsNeeded * 0.8) {
    warnings.push({
      type: "warning",
      code: "INSUFFICIENT_CARBS",
      message: `Inventory may be insufficient: ${Math.round(totalCarbsAvailable)}g available vs ${Math.round(totalCarbsNeeded)}g needed.`,
      detail:
        "Consider adding more items or increasing quantities. This assumes no aid station resupply.",
    });
  }

  if (athlete.carbTargetPerHour > athlete.maxCarbsPerHour) {
    warnings.push({
      type: "error",
      code: "CARB_TARGET_EXCEEDS_TOLERANCE",
      message: `Carb target (${athlete.carbTargetPerHour}g/hr) exceeds tolerance limit (${athlete.maxCarbsPerHour}g/hr).`,
      detail: "Reduce your carb target or revise your tolerance estimate.",
    });
  }

  if (athlete.carbTargetPerHour > 90) {
    warnings.push({
      type: "info",
      code: "HIGH_CARB_TARGET",
      message: `${athlete.carbTargetPerHour}g/hr is a high carb target — this requires mixed carb sources (glucose + fructose) and gut training.`,
    });
  }
}

function checkInventoryExhaustion(
  inventory: FuelItem[],
  usage: Map<string, number>,
  warnings: PlanWarning[]
) {
  for (const item of inventory) {
    const used = usage.get(item.id) ?? 0;
    if (used > item.quantityAvailable) {
      warnings.push({
        type: "warning",
        code: "ITEM_EXHAUSTED",
        message: `${item.productName}: plan uses ${used} but you only have ${item.quantityAvailable}.`,
        detail: "Increase quantity or ensure resupply at aid stations.",
      });
    }
  }
}

function buildEntryWarnings(
  item: FuelItem,
  quantity: number,
  usage: Map<string, number>,
  athlete: AthleteProfile,
  raceHoursNow: number
): string[] {
  const ws: string[] = [];
  const used = usage.get(item.id) ?? 0;
  const remaining = item.quantityAvailable - used;
  if (remaining <= 3) ws.push(`Low supply: only ${remaining} left.`);
  if (
    athlete.preferences.noSweetAfterHour &&
    raceHoursNow >= athlete.preferences.noSweetAfterHour &&
    item.sweetnessScore >= 4
  ) {
    ws.push(`Sweet item after hour ${athlete.preferences.noSweetAfterHour} — may cause nausea.`);
  }
  return ws;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeToAction(type: FuelType): FuelAction {
  const map: Record<FuelType, FuelAction> = {
    gel: "consume_gel",
    chew: "consume_chew",
    bar: "consume_bar",
    real_food: "consume_food",
    drink_mix: "drink_fluid",
    capsule: "take_capsule",
    other: "consume_food",
  };
  return map[type] ?? "consume_gel";
}

// ─── Format helpers ───────────────────────────────────────────────────────────

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
