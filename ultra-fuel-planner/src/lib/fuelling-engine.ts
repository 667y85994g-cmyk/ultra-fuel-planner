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
  HydrationGuidance,
  ElectrolyteGuidance,
} from "@/types";
import { getCumulativeTimeMinutes, terrainLabel } from "./segmentation";
import { caloricBurnRate } from "./energy-model";
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

// ─── Race Strategy Layer ──────────────────────────────────────────────────────
//
// The Race Strategy Layer sits between carb target selection (Layer 2) and
// product allocation (schedule generation). It determines the type of fuelling
// plan — drink-led, mixed, or discrete-heavy — based on race duration.
// Product allocation implements the strategy, not the reverse.

type StrategyBackbone = "drink_led" | "mixed" | "discrete_heavy";
type RacePhase = "early" | "mid" | "late";

interface RaceStrategyPlan {
  backbone: StrategyBackbone;
  /** Target % of section carbs to deliver via drink mix, by phase */
  drinkMixSharePct: Record<RacePhase, number>;
  /** Whether solid foods (bars, real_food) are permitted, by phase */
  allowSolids: Record<RacePhase, boolean>;
  /** Whether chews are permitted, by phase */
  allowChews: Record<RacePhase, boolean>;
  /** Phase boundaries as fraction of total race time */
  earlyRaceEndPct: number;
  lateRaceStartPct: number;
  rationale: string[];
}

/**
 * Phase carb load factors: fraction of the base carb target to allocate each phase.
 * Early race ramps up gradually. Mid race delivers the full target. Late race scales
 * back slightly as gut tolerance typically decreases.
 */
const PHASE_LOAD_FACTOR: Record<RacePhase, number> = {
  early: 0.90,
  mid:   1.00,
  late:  0.92,
};

/**
 * Builds a race fuelling strategy from total race duration.
 * Returns a RaceStrategyPlan that governs drink mix share, phase boundaries,
 * and what product formats are permitted in each phase.
 */
function buildRaceStrategy(
  totalRaceHours: number,
  athlete: AthleteProfile,
): RaceStrategyPlan {
  const rationale: string[] = [];

  if (totalRaceHours < 6) {
    rationale.push(
      "Discrete fuelling strategy (<6h): gels and chews are primary; drink mix supplements.",
    );
    rationale.push(
      "Solids permitted in early race only. Chews throughout. No bars or solids after early phase.",
    );
    return {
      backbone: "discrete_heavy",
      drinkMixSharePct: { early: 20, mid: 25, late: 20 },
      allowSolids:      { early: true,  mid: false, late: false },
      allowChews:       { early: true,  mid: true,  late: true  },
      earlyRaceEndPct:  0.25,
      lateRaceStartPct: 0.65,
      rationale,
    };
  }

  if (totalRaceHours < 12) {
    rationale.push(
      "Mixed fuelling strategy (6\u201312h): drink mix provides carb backbone; gels and chews fill gaps.",
    );
    rationale.push(
      "Solids permitted on easy terrain in early and mid race. No bars or solids in late race.",
    );
    return {
      backbone: "mixed",
      drinkMixSharePct: { early: 30, mid: 45, late: 40 },
      allowSolids:      { early: true,  mid: true,  late: false },
      allowChews:       { early: true,  mid: true,  late: true  },
      earlyRaceEndPct:  0.25,
      lateRaceStartPct: 0.60,
      rationale,
    };
  }

  if (totalRaceHours < 20) {
    rationale.push(
      "Drink-led mixed strategy (12\u201320h): drink mix is the primary carb vehicle after the early phase.",
    );
    rationale.push(
      "Solids in early race only. Chews in early and mid. Late race: liquids and gels only.",
    );
    return {
      backbone: "mixed",
      drinkMixSharePct: { early: 40, mid: 55, late: 65 },
      allowSolids:      { early: true,  mid: false, late: false },
      allowChews:       { early: true,  mid: true,  late: false },
      earlyRaceEndPct:  0.25,
      lateRaceStartPct: 0.55,
      rationale,
    };
  }

  // 20h+ ultra
  rationale.push(
    "Drink-led strategy (20h+): drink mix and gels are the primary carb sources throughout.",
  );
  rationale.push(
    "Solids in the first quarter of the race only. Late race: liquids and gels only.",
  );

  // Respect drinkHeavy preference — no change needed, already the most drink-led path
  void athlete; // athlete context available for future adjustments

  return {
    backbone: "drink_led",
    drinkMixSharePct: { early: 50, mid: 65, late: 70 },
    allowSolids:      { early: true,  mid: false, late: false },
    allowChews:       { early: true,  mid: false, late: false },
    earlyRaceEndPct:  0.25,
    lateRaceStartPct: 0.50,
    rationale,
  };
}

/** Returns the current race phase for a given elapsed time. */
function getPhaseAtTime(
  timeMinutes: number,
  totalRaceMinutes: number,
  strategy: RaceStrategyPlan,
): RacePhase {
  if (totalRaceMinutes <= 0) return "mid";
  const pct = timeMinutes / totalRaceMinutes;
  if (pct >= strategy.lateRaceStartPct) return "late";
  if (pct >= strategy.earlyRaceEndPct)  return "mid";
  return "early";
}

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
  const calibration = plan.calibration ?? calibrateFromPriorEfforts(
    plan.priorEfforts ?? [],
    plan.athlete,
    plan.targetFinishTimeMinutes,
    plan.racePriority,
  );

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
    message: `Working carb target: ${carbTarget}g/hr (recommended range: ${calibration.suggestedCarbRangeGPerHour[0]}\u2013${calibration.suggestedCarbRangeGPerHour[1]}g/hr). Based on estimated race duration and experience level.`,
  });
  warnings.push({
    type: "info",
    code: "KCAL_CONTEXT",
    message: `Estimated caloric burn: ~${avgKcalPerHour} kcal/hr (route-adjusted). This informs fuel selection context but does not determine your carb target.`,
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

  // ── Race Strategy Layer: determine strategy before product allocation ─────
  const strategy = buildRaceStrategy(totalRaceHours, plan.athlete);
  for (const note of strategy.rationale) {
    warnings.push({ type: "info", code: "RACE_STRATEGY", message: note });
  }

  const schedule = generateSchedule(
    segments, fuelInventory, aidStations, athlete, assumptions, totalRaceMinutes, strategy, warnings
  );

  const carryPlans = generateCarryPlans(
    segments, aidStations, schedule, fuelInventory, athlete, assumptions
  );

  const summary = buildSummary(schedule, fuelInventory, totalRaceMinutes, athlete, segments, avgKcalPerHour, calibration, plan.expectedTemperatureC);

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
  const cadenceMins = deriveCadenceMinutes(totalRaceHours);

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
      derivedFuelIntervalMinutes: cadenceMins,
    };
  });
}

// ─── Cadence engine ───────────────────────────────────────────────────────────
//
// Cadence is driven by RACE DURATION, not burn rate.
// Burn rate provides contextual information but does NOT determine when to eat.
//
// Formula: eventCarbTarget = workingCarbTargetPerHour × (cadenceMins / 60)
// Event size is then clamped to 12–40g for discrete items.

/**
 * Returns the base fuelling cadence in minutes for a given total race duration.
 *
 *   < 6h:   ~22 min  — shorter races require more frequent topping-up
 *   6–12h:  ~27 min  — medium ultra rhythm; gut can handle regular small feeds
 *   12–20h: ~32 min  — longer races; gut needs rest between events
 *   20h+:   ~37 min  — very long races; slower pace, more real-food variety
 *
 * Critical constraint: no discrete fuel gap may exceed 45 min unless a
 * continuous carb source (drink mix) is actively covering that window.
 */
export function deriveCadenceMinutes(totalRaceHours: number): number {
  if (totalRaceHours < 6)  return 22;
  if (totalRaceHours < 12) return 27;
  if (totalRaceHours < 20) return 32;
  return 37;
}

/**
 * Snaps a raw calculated cadence to the nearest natural fuelling rhythm.
 *
 * Ultra runners fuel at recognisable intervals, not arbitrary calculated decimals.
 * This maps any cadence in the 15–35 min range to the closest value from five
 * clean milestones that span the operational fuelling envelope:
 *
 *   15 min — very frequent (high-intensity, high carb density, short race)
 *   20 min — frequent top-ups (short ultra, high carb needs)
 *   25 min — standard endurance (most mid-distance ultras)
 *   30 min — relaxed endurance (mixed or food-based fuelling)
 *   35 min — conservative pacing (long ultra, lower intensity)
 *
 * Nearest-neighbour selection. Ties resolve to the lower (more conservative) value.
 */
function snapToNaturalCadence(rawCadence: number): number {
  const naturalCadences = [15, 20, 25, 30, 35];
  let best = naturalCadences[0];
  let bestDist = Math.abs(rawCadence - best);
  for (const c of naturalCadences) {
    const dist = Math.abs(rawCadence - c);
    if (dist < bestDist) {
      bestDist = dist;
      best = c;
    }
  }
  return best;
}

// ─── Section architecture ─────────────────────────────────────────────────────
//
// The schedule is structured around sections (aid-station-to-aid-station).
// If no aid stations are defined, sections are inferred every ~120 minutes.

interface Section {
  fromLabel: string;
  toLabel: string;
  fromKm: number;
  toKm: number;
  fromMinutes: number;
  toMinutes: number;
  segments: RouteSegment[];
  isInferred: boolean;
}

function buildSections(
  segments: RouteSegment[],
  aidStations: AidStation[],
  totalRaceMinutes: number,
): Section[] {
  if (segments.length === 0) return [];

  const totalKm = segments[segments.length - 1].endKm;

  if (aidStations.length > 0) {
    const checkpoints = [
      { name: "Start", km: 0 },
      ...aidStations
        .filter(a => a.distanceKm > 0 && a.distanceKm < totalKm)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .map(a => ({ name: a.name, km: a.distanceKm })),
      { name: "Finish", km: totalKm },
    ];

    return checkpoints.slice(0, -1).map((cp, i) => {
      const next = checkpoints[i + 1];
      return {
        fromLabel: cp.name,
        toLabel: next.name,
        fromKm: cp.km,
        toKm: next.km,
        fromMinutes: getTimeAtKm(segments, cp.km),
        toMinutes: getTimeAtKm(segments, next.km),
        segments: segments.filter(s => s.endKm > cp.km && s.startKm < next.km),
        isInferred: false,
      };
    });
  }

  return inferSections(segments, totalRaceMinutes);
}

/**
 * When no aid stations are defined, divides the race into sections of
 * approximately 90–150 minutes each (targeting ~120 min per section).
 */
function inferSections(segments: RouteSegment[], totalRaceMinutes: number): Section[] {
  const numSections = Math.max(1, Math.round(totalRaceMinutes / 120));
  const minsPerSection = totalRaceMinutes / numSections;

  const sections: Section[] = [];
  for (let i = 0; i < numSections; i++) {
    const fromMins = Math.round(i * minsPerSection);
    const toMins = i === numSections - 1
      ? totalRaceMinutes
      : Math.round((i + 1) * minsPerSection);
    const fromKm = getKmAtTime(segments, fromMins);
    const toKm = getKmAtTime(segments, toMins);
    sections.push({
      fromLabel: i === 0 ? "Start" : `~km\u00a0${Math.round(fromKm)}`,
      toLabel: i === numSections - 1 ? "Finish" : `~km\u00a0${Math.round(toKm)}`,
      fromKm,
      toKm,
      fromMinutes: fromMins,
      toMinutes: toMins,
      segments: segments.filter(s => s.endKm > fromKm && s.startKm < toKm),
      isInferred: true,
    });
  }
  return sections;
}

/** Interpolates time (minutes from start) at a given km position. */
function getTimeAtKm(segments: RouteSegment[], km: number): number {
  let cumulativeMins = 0;
  for (const seg of segments) {
    if (km <= seg.startKm) return cumulativeMins;
    if (km <= seg.endKm) {
      const frac = seg.distanceKm > 0 ? (km - seg.startKm) / seg.distanceKm : 0;
      return cumulativeMins + frac * seg.estimatedDurationMinutes;
    }
    cumulativeMins += seg.estimatedDurationMinutes;
  }
  return cumulativeMins;
}

/** Interpolates km position at a given time (minutes from start). */
function getKmAtTime(segments: RouteSegment[], targetMins: number): number {
  let cumulativeMins = 0;
  for (const seg of segments) {
    const segEnd = cumulativeMins + seg.estimatedDurationMinutes;
    if (targetMins <= segEnd) {
      const frac = seg.estimatedDurationMinutes > 0
        ? (targetMins - cumulativeMins) / seg.estimatedDurationMinutes
        : 0;
      return seg.startKm + frac * seg.distanceKm;
    }
    cumulativeMins += seg.estimatedDurationMinutes;
  }
  return segments[segments.length - 1]?.endKm ?? 0;
}

/** Returns the RouteSegment that is active at a given race time. */
function findSegmentAtTime(segments: RouteSegment[], timeMinutes: number): RouteSegment | null {
  let cumulativeMins = 0;
  for (const seg of segments) {
    if (timeMinutes < cumulativeMins + seg.estimatedDurationMinutes) return seg;
    cumulativeMins += seg.estimatedDurationMinutes;
  }
  return segments[segments.length - 1] ?? null;
}

// ─── Cadence slot generation ──────────────────────────────────────────────────

interface CadenceSlot {
  timeMinutes: number;
  distanceKm: number;
  isPriority: boolean;
}

/**
 * Generates evenly-spaced fuelling moments within a section.
 * First slot is offset by cadence/2 (mid-first-interval), then every cadenceMins.
 * This ensures the first event is not right at the section boundary.
 */
function generateCadenceSlots(section: Section, cadenceMins: number): CadenceSlot[] {
  const sectionMins = section.toMinutes - section.fromMinutes;
  if (sectionMins <= 0) return [];

  const slots: CadenceSlot[] = [];
  let offset = cadenceMins / 2;

  while (offset < sectionMins) {
    const sectionFrac = sectionMins > 0 ? offset / sectionMins : 0;
    const distanceKm = section.fromKm + sectionFrac * (section.toKm - section.fromKm);
    slots.push({
      timeMinutes: Math.round(section.fromMinutes + offset),
      distanceKm: Math.round(distanceKm * 10) / 10,
      isPriority: slots.length === 0,
    });
    offset += cadenceMins;
  }

  return slots;
}

// ─── Product-driven cadence helpers ──────────────────────────────────────────
//
// Cadence is derived from product reality, not a fixed duration band.
// Flow: identify likely product format → realistic event size → derive cadence.

/**
 * Lightweight pre-selection of a discrete fuel for cadence calculation.
 * Does not consume inventory — just identifies the likely dominant format.
 */
function preselectFuelForCadence(
  inventory: FuelItem[],
  usage: Map<string, number>,
  terrain: TerrainType,
  phase: RacePhase,
  strategy: RaceStrategyPlan,
): FuelItem | null {
  const rule = TERRAIN_RULES[terrain];
  const available = inventory.filter(item => {
    const used = usage.get(item.id) ?? 0;
    if (used >= item.quantityAvailable) return false;
    if (rule.avoid.includes(item.type)) return false;
    if (!strategy.allowSolids[phase] && (item.type === "bar" || item.type === "real_food")) return false;
    if (!strategy.allowChews[phase] && item.type === "chew") return false;
    return true;
  });
  if (available.length === 0) return null;
  return available.sort((a, b) => {
    const aPref = rule.preferred.indexOf(a.type);
    const bPref = rule.preferred.indexOf(b.type);
    const aN = aPref === -1 ? 99 : aPref;
    const bN = bPref === -1 ? 99 : bPref;
    if (aN !== bN) return aN - bN;
    return b.carbsPerServing - a.carbsPerServing;
  })[0] ?? null;
}

/**
 * Returns a realistic fuelling event size in grams for a given fuel item.
 * Clamps the item's actual carbs per serving into the expected range for that product type.
 * This ensures event sizes match real product norms rather than floating to arbitrary values.
 */
function realisticEventSize(item: FuelItem): number {
  switch (item.type) {
    case "gel":       return Math.max(18, Math.min(25, item.carbsPerServing));
    case "chew":      return Math.max(20, Math.min(30, item.carbsPerServing));
    case "real_food": return Math.max(18, Math.min(25, item.carbsPerServing));
    case "bar":       return Math.max(35, Math.min(45, item.carbsPerServing));
    default:          return Math.max(18, Math.min(40, item.carbsPerServing));
  }
}

// ─── Drink mix helpers ────────────────────────────────────────────────────────

/**
 * Selects the best available drink mix item for a section.
 * Prefers higher carb density; respects athlete exclusions and caffeine limits.
 */
function findBestAvailableDrinkMix(
  drinkMixItems: FuelItem[],
  usage: Map<string, number>,
  athlete: AthleteProfile,
): FuelItem | null {
  const available = drinkMixItems.filter(item => {
    const used = usage.get(item.id) ?? 0;
    if (used >= item.quantityAvailable) return false;
    if (athlete.preferences.exclusions.includes(item.productName)) return false;
    if (athlete.caffeinePreference === "none" && item.caffeinePerServingMg > 0) return false;
    return true;
  });
  if (available.length === 0) return null;
  return available.sort((a, b) => b.carbsPerServing - a.carbsPerServing)[0];
}

/**
 * Determines how many drink mix servings to use for a section, guided by the
 * race strategy. Targets delivering drinkMixSharePct% of the section carb goal
 * from the drink mix, capped by available stock.
 */
function computeStrategyDrinkMixServings(
  item: FuelItem,
  sectionTargetCarbs: number,
  drinkMixSharePct: number,
  usage: Map<string, number>,
  sectionHours: number,
): number {
  const used = usage.get(item.id) ?? 0;
  const remaining = item.quantityAvailable - used;
  if (remaining <= 0) return 0;
  const targetCarbsFromMix = Math.round(sectionTargetCarbs * (drinkMixSharePct / 100));
  if (targetCarbsFromMix <= 0) return 0;
  const servingsNeeded = item.carbsPerServing > 0
    ? Math.max(1, Math.ceil(targetCarbsFromMix / item.carbsPerServing))
    : 1;
  // Density constraint: max 80g carbs per litre prevents unrealistic concentrations.
  // Use the item's standard bottle volume (fluidContributionMl) to compute max carbs per fill.
  // Runner refills roughly once per 2 hours.
  const bottleMl = item.fluidContributionMl > 0 ? item.fluidContributionMl : 500;
  const maxCarbsPerBottle = bottleMl * 0.08; // 80g/L = 0.08g/mL
  const servingsPerBottle = item.carbsPerServing > 0
    ? Math.max(1, Math.floor(maxCarbsPerBottle / item.carbsPerServing))
    : 1;
  const refillsInSection = Math.max(1, Math.ceil(sectionHours / 2));
  const densityCap = servingsPerBottle * refillsInSection;
  return Math.min(servingsNeeded, remaining, densityCap);
}

// ─── Schedule generation ──────────────────────────────────────────────────────
//
// Architecture (v2.8 — cadence/product compatibility system):
//   1. Build sections (aid-station-bounded, or inferred every ~120 min)
//   2. Per section: allocate drink_mix as a continuous section-level carb source
//      (capped by 80g/L density limit and ~1 bottle refill per 2 hours)
//   3. Identify representative discrete fuel → derive realistic event size (eventSizeG)
//      Enforce global event size bounds: [15g, 45g] — operationally realistic servings
//   4. Derive PROVISIONAL event count: rawCount = ceil(discreteTargetCarbs / eventSizeG)
//      → grounded in actual carb need; capped at 4 events/hr (minimum 15-min cadence)
//   5. Derive raw cadence from section duration: rawCadence = sectionMins / rawCount
//      → cadence reflects how frequently events are actually needed, not product rate
//   6. Clamp raw cadence to [15, 35] min — the primary operational fuelling envelope:
//        < 15 min: too frequent for gut absorption and operationally impractical
//        > 35 min: too sparse; risks energy deficit and cadence drift
//   7. SNAP clamped cadence to nearest rhythm in [15, 20, 25, 30, 35]
//      → five clean milestones that runners recognise and can execute
//   7a. COMPATIBILITY CHECK: if eventSizeG > cadenceCapacityG × 1.1, the product is
//      too large to deliver comfortably at this cadence. Step up through the extended
//      cadence ladder [15, 20, 25, 30, 35, 38, 40] until compatible or 40 min reached.
//      cadenceCapacityG = (discreteTargetCarbs / sectionHours) × (cadence / 60)
//      Values 38 and 40 are only reachable via this compatibility path, not via snap.
//   8. RECONCILE event count: eventCount = floor(sectionMins / snappedCadence)
//      → count and cadence are algebraically consistent; floor() guarantees all
//         events stay within section bounds — no clamping or truncation needed
//   9. Validate 85–115% delivery tolerance; nudge eventCount ±1 if needed
//      → +1 nudge has explicit bounds check: (eventCount + 1) × snappedCadence ≤ sectionMins
//  10. Generate events at sectionStart + (i+1) × snappedCadence
//  11. Post-section sanity check: verify cadence ∈ [15, 40], no event overflow
//  12. Post-loop: gap-fill guardrail inserts events in gaps > 60 min (with mix) / 45 min
//  13. Post-loop output sanity pass: validate event sizes across full schedule (Layer I)
//  14. Validate section carb delivery (Layer H)
//
// Four constraints solved simultaneously per section:
//   • Carb delivery ≈ section target (±15% tolerance)
//   • Cadence ∈ [15, 40] min — snap set [15,20,25,30,35]; 38/40 via compatibility only
//   • Event size ∈ [15, 45] g — operationally realistic per-serving amounts
//   • All events within section duration — guaranteed by floor() in step 8

function generateSchedule(
  segments: RouteSegment[],
  inventory: FuelItem[],
  aidStations: AidStation[],
  athlete: AthleteProfile,
  assumptions: PlannerAssumptions,
  totalRaceMinutes: number,
  strategy: RaceStrategyPlan,
  warnings: PlanWarning[]
): FuelScheduleEntry[] {
  const schedule: FuelScheduleEntry[] = [];
  const inventoryUsage = new Map<string, number>();
  let totalCaffeineMg = 0;
  const caffeineLimitMg = athlete.caffeineMaxMg ?? 400;
  let entryIdx = 0;
  let solidCarbsSoFar = 0;
  let liquidCarbsSoFar = 0;

  const totalRaceHours = totalRaceMinutes / 60;
  const sections = buildSections(segments, aidStations, totalRaceMinutes);

  const drinkMixItems = inventory.filter(i => i.type === "drink_mix");
  const discreteInventory = inventory.filter(i => i.type !== "drink_mix");

  for (const section of sections) {
    const sectionMins = section.toMinutes - section.fromMinutes;
    const sectionHours = sectionMins / 60;

    // ── Race Strategy: determine phase and apply phase carb load factor ─────
    const sectionMidMinutes = section.fromMinutes + sectionMins / 2;
    const phase = getPhaseAtTime(sectionMidMinutes, totalRaceMinutes, strategy);
    const phaseFactor = PHASE_LOAD_FACTOR[phase];
    const sectionTargetCarbs = Math.round(athlete.carbTargetPerHour * sectionHours * phaseFactor);

    // ── Layer D: Drink mix as continuous section-level carb source ──────────
    let drinkMixCarbsThisSection = 0;
    const bestDrinkMix = findBestAvailableDrinkMix(drinkMixItems, inventoryUsage, athlete);

    if (bestDrinkMix) {
      const servings = computeStrategyDrinkMixServings(
        bestDrinkMix, sectionTargetCarbs, strategy.drinkMixSharePct[phase], inventoryUsage, sectionHours,
      );
      if (servings > 0) {
        drinkMixCarbsThisSection = Math.round(bestDrinkMix.carbsPerServing * servings);
        const used = inventoryUsage.get(bestDrinkMix.id) ?? 0;
        inventoryUsage.set(bestDrinkMix.id, used + servings);
        totalCaffeineMg += Math.round(bestDrinkMix.caffeinePerServingMg * servings);
        liquidCarbsSoFar += drinkMixCarbsThisSection;

        const firstSeg = section.segments[0] ?? segments[0];
        if (firstSeg) {
          schedule.push({
            id: `entry-${++entryIdx}-mix`,
            timeMinutes: section.fromMinutes,
            distanceKm: Math.round(section.fromKm * 10) / 10,
            segmentId: firstSeg.id,
            terrain: firstSeg.terrain,
            action: "drink_fluid",
            fuelItemId: bestDrinkMix.id,
            fuelItemName: bestDrinkMix.productName,
            quantity: servings,
            carbsG: drinkMixCarbsThisSection,
            fluidMl: Math.round(bestDrinkMix.fluidContributionMl * servings),
            sodiumMg: Math.round(bestDrinkMix.sodiumPerServingMg * servings),
            caffeinesMg: Math.round(bestDrinkMix.caffeinePerServingMg * servings),
            rationale: `Mix ${servings}\u00a0serving${servings > 1 ? "s" : ""} into bottle \u2014 sip continuously over ${formatDuration(sectionMins)} (~${drinkMixCarbsThisSection}g carbs).`,
            priority: "required",
            isNearAidStation: false,
            isContinuous: true,
            warnings: [],
          });
        }
      }
    }

    // ── Layer E: Discrete events to top up to section target ───────────────
    const discreteTargetCarbs = Math.max(0, sectionTargetCarbs - drinkMixCarbsThisSection);

    // Constrained cadence system (v2.7):
    // Solves four constraints simultaneously: delivery ≈ target (±15%), cadence ∈ [15, 35] min,
    // event size ∈ [15, 45] g, all events within section. Operational realism over precision.
    const representativeSeg = section.segments[0] ?? (segments.length > 0 ? segments[0] : null);
    const representativeFuel = representativeSeg
      ? preselectFuelForCadence(discreteInventory, inventoryUsage, representativeSeg.terrain, phase, strategy)
      : null;
    // Enforce global event size bounds: [15g, 45g]. Per-type norms from realisticEventSize()
    // are already within this range for standard products; the clamp handles edge cases.
    const eventSizeG = Math.max(15, Math.min(45,
      representativeFuel ? realisticEventSize(representativeFuel) : 22,
    ));

    // Step A — Provisional event count: how many events to cover the discrete carb target?
    // This seeds the cadence calculation; the final count is reconciled in Step D.
    let eventCount = 0;
    if (discreteTargetCarbs > 0 && eventSizeG > 0) {
      const rawCount = Math.ceil(discreteTargetCarbs / eventSizeG);
      const maxCount = Math.max(1, Math.floor(sectionHours * 4)); // cap: 1 event per 15 min
      eventCount = Math.max(1, Math.min(rawCount, maxCount));
    }

    // Step B — Raw cadence from section duration ÷ provisional event count.
    // Deriving cadence from the count (not product rate) grounds the rhythm in
    // the actual carb need for this section.
    const rawCadence = eventCount > 0 && sectionMins > 0
      ? sectionMins / eventCount
      : 0;

    // Step C — Clamp to [15, 35] min, then snap to nearest natural rhythm.
    // [15, 35] is the primary operational envelope. Step C' (compatibility) may
    // extend cadence to 38 or 40 if the representative product is too large.
    const clampedRawCadence = Math.max(15, Math.min(35, rawCadence));
    let snappedCadence = rawCadence > 0 ? snapToNaturalCadence(clampedRawCadence) : 0;

    // Step C' — Product/cadence compatibility check.
    // A product event should not significantly exceed the carb delivery that
    // the cadence interval implies. If it does, step up through the extended
    // cadence ladder [15, 20, 25, 30, 35, 38, 40] until the product fits.
    // Stopping condition: eventSizeG ≤ cadenceCapacityG × 1.1
    //   (10% tolerance — allows a product slightly larger than the exact capacity
    //    and matches common runner intuition: "eat one gel, wait about 38 minutes")
    // If no value satisfies the condition, cadence is set to the maximum (40 min).
    if (snappedCadence > 0 && sectionHours > 0 && eventSizeG > 0 && discreteTargetCarbs > 0) {
      const discreteCarbsPerHour = discreteTargetCarbs / sectionHours;
      const extendedCadences: number[] = [15, 20, 25, 30, 35, 38, 40];
      // Find starting position: first extended value at or above the snapped cadence.
      let extIdx = extendedCadences.findIndex(c => c >= snappedCadence);
      if (extIdx < 0) extIdx = extendedCadences.length - 1;
      // Walk up the ladder while eventSizeG still exceeds cadence capacity × 1.1.
      while (extIdx < extendedCadences.length - 1) {
        const cadenceCapacityG = discreteCarbsPerHour * (extendedCadences[extIdx] / 60);
        if (eventSizeG <= cadenceCapacityG * 1.1) break;
        extIdx += 1;
      }
      snappedCadence = extendedCadences[extIdx];
    }

    // Step D — Reconcile event count from (compatibility-adjusted) snapped cadence.
    // floor() guarantees eventCount × snappedCadence ≤ sectionMins.
    if (snappedCadence > 0 && discreteTargetCarbs > 0 && sectionMins > 0) {
      eventCount = Math.max(1, Math.floor(sectionMins / snappedCadence));
    }

    // Step E — Delivery validation: nudge ±1 if outside 85–115% of discrete target.
    // The +1 nudge includes an explicit bounds check: the extra event must fit within
    // the section at snapped cadence — preventing overflow without clamping.
    if (eventCount > 0 && discreteTargetCarbs > 0 && snappedCadence > 0) {
      const deliveryRatio = (eventCount * eventSizeG) / discreteTargetCarbs;
      if (deliveryRatio < 0.85) {
        if ((eventCount + 1) * snappedCadence <= sectionMins) eventCount += 1;
      } else if (deliveryRatio > 1.15 && eventCount > 1) {
        eventCount -= 1;
      }
    }

    // Step F — Generate events at (i+1) × snappedCadence from section start.
    // floor() in Step D guarantees all events are within section bounds — no clamping needed.
    const scheduledSlots: Array<{ timeMinutes: number; distanceKm: number; isPriority: boolean }> = [];
    for (let i = 0; i < eventCount; i++) {
      const offset = (i + 1) * snappedCadence;
      const sectionFrac = sectionMins > 0 ? offset / sectionMins : 0;
      const distanceKm = Math.round(
        (section.fromKm + sectionFrac * (section.toKm - section.fromKm)) * 10
      ) / 10;
      scheduledSlots.push({
        timeMinutes: Math.round(section.fromMinutes + offset),
        distanceKm,
        isPriority: i === 0,
      });
    }

    // ── Sanity check: verify constraints before slot processing ─────────────
    // These guards should never fire if the pipeline above is correct. They are
    // a defensive safety net that detects and auto-corrects any constraint
    // violations rather than silently producing a bad race card.
    if (snappedCadence > 0 && sectionMins > 0) {
      // Guard 1: cadence must be within the operational envelope.
      // Normal primary range is [15, 35]; compatibility step (C') may extend to 40.
      if (snappedCadence < 15 || snappedCadence > 40) {
        warnings.push({
          type: "info",
          code: "SANITY_CADENCE",
          message: `${section.fromLabel}→${section.toLabel}: cadence ${snappedCadence} min outside [15, 40] range.`,
          detail: "Unusual section parameters — plan generated with available constraints.",
        });
      }
      // Guard 2: event overflow — floor() in Step D should prevent this, but
      // auto-correct if somehow the event count would push past section end.
      if (eventCount > 0 && eventCount * snappedCadence > sectionMins + 0.5) {
        const corrected = Math.max(1, Math.floor(sectionMins / snappedCadence));
        warnings.push({
          type: "info",
          code: "SANITY_OVERFLOW",
          message: `${section.fromLabel}→${section.toLabel}: event count corrected ${eventCount}→${corrected} (${snappedCadence} min × ${eventCount} > ${Math.round(sectionMins)} min).`,
          detail: "Event count was rebalanced to fit within section bounds.",
        });
        eventCount = corrected;
      }
    }

    for (const slot of scheduledSlots) {
      const slotSeg = findSegmentAtTime(segments, slot.timeMinutes);
      if (!slotSeg) continue;

      const rule = TERRAIN_RULES[slotSeg.terrain];
      const raceHoursNow = slot.timeMinutes / 60;

      // Layer F: Skip discrete events on technical descent (sip from bottle only)
      if (slotSeg.terrain === "technical_descent") continue;

      const nearAid = aidStations.find(
        as => Math.abs(as.distanceKm - slot.distanceKm) < 1.5
      );

      const selectedFuel = selectBestFuel(
        discreteInventory, inventoryUsage, slotSeg.terrain, rule, athlete,
        raceHoursNow, totalRaceHours, totalCaffeineMg, caffeineLimitMg,
        solidCarbsSoFar, liquidCarbsSoFar, !!nearAid,
        phase, strategy,
      );

      if (!selectedFuel) {
        warnings.push({
          type: "warning",
          code: "NO_SUITABLE_FUEL",
          message: `No suitable fuel at km\u00a0${slot.distanceKm.toFixed(1)} (${terrainLabel(slotSeg.terrain)}).`,
          detail: "Consider adding more fuel items to your inventory.",
        });
        continue;
      }

      // One serving per event — event size follows the product, not a calculated carb target.
      const servings = 1;
      const actualCarbs = Math.round(selectedFuel.carbsPerServing * servings);

      const used = inventoryUsage.get(selectedFuel.id) ?? 0;
      inventoryUsage.set(selectedFuel.id, used + servings);
      totalCaffeineMg += Math.round(selectedFuel.caffeinePerServingMg * servings);

      if (selectedFuel.requiresChewing) solidCarbsSoFar += actualCarbs;
      else liquidCarbsSoFar += actualCarbs;

      schedule.push({
        id: `entry-${++entryIdx}`,
        timeMinutes: slot.timeMinutes,
        distanceKm: slot.distanceKm,
        segmentId: slotSeg.id,
        terrain: slotSeg.terrain,
        action: typeToAction(selectedFuel.type),
        fuelItemId: selectedFuel.id,
        fuelItemName: selectedFuel.productName,
        quantity: servings,
        carbsG: actualCarbs,
        fluidMl: Math.round(selectedFuel.fluidContributionMl * servings),
        sodiumMg: Math.round(selectedFuel.sodiumPerServingMg * servings),
        caffeinesMg: Math.round(selectedFuel.caffeinePerServingMg * servings),
        rationale: `${terrainLabel(slotSeg.terrain)}: ${rule.rationale}`,
        priority: slot.isPriority ? "required" : "recommended",
        isNearAidStation: !!nearAid,
        warnings: buildEntryWarnings(selectedFuel, servings, inventoryUsage, athlete, raceHoursNow),
      });

      if (nearAid && Math.abs(nearAid.distanceKm - slot.distanceKm) < 0.5) {
        schedule.push({
          id: `entry-${++entryIdx}-aid`,
          timeMinutes: slot.timeMinutes + 1,
          distanceKm: nearAid.distanceKm,
          segmentId: slotSeg.id,
          terrain: slotSeg.terrain,
          action: "refill_at_aid",
          quantity: 1,
          carbsG: 0,
          fluidMl: nearAid.fullRefillPossible ? athlete.fluidTargetPerHourMl : 500,
          sodiumMg: 0,
          caffeinesMg: 0,
          rationale: `Aid station: ${nearAid.name}. ${nearAid.fullRefillPossible ? "Full refill possible." : "Partial resupply."}`,
          priority: "required",
          isNearAidStation: true,
          warnings: [],
        });
      }
    }

    // ── Layer H: Section carb delivery validation ──────────────────────────
    const sectionEntries = schedule.filter(
      e => e.timeMinutes >= section.fromMinutes
        && e.timeMinutes < section.toMinutes
        && e.action !== "refill_at_aid"
        && e.action !== "restock_carry"
    );
    const scheduledCarbs = sectionEntries.reduce((sum, e) => sum + e.carbsG, 0);
    if (sectionTargetCarbs > 0) {
      const deliveryRatio = scheduledCarbs / sectionTargetCarbs;
      if (deliveryRatio < 0.70 || deliveryRatio > 1.45) {
        warnings.push({
          type: "warning",
          code: "SECTION_CARB_GAP",
          message: `${section.fromLabel}\u2192${section.toLabel}: ${scheduledCarbs}g delivered vs ${sectionTargetCarbs}g target (${Math.round(deliveryRatio * 100)}%).`,
          detail: deliveryRatio < 0.70
            ? "Inventory may be insufficient for this section \u2014 check item quantities."
            : "Plan slightly over-delivers for this section; adjust quantities if needed.",
        });
      }
    }
  }

  // ── Gap-fill guardrail ───────────────────────────────────────────────────
  // After all sections are scheduled, scan for gaps between discrete events.
  // With drink mix providing continuous carbs: max tolerated gap = 60 min.
  // Without drink mix:                         max tolerated gap = 45 min.
  // For each gap exceeding the limit, attempt to insert one event at the midpoint.
  // A single pass is used (not recursive) — the goal is to catch structural gaps,
  // not to achieve perfect carb continuity.
  {
    const hasDrinkMix = inventory.some(i => i.type === "drink_mix" && i.quantityAvailable > 0);
    const maxGapMins = hasDrinkMix ? 60 : 45;

    const discreteSnapshot = schedule
      .filter(e => !e.isContinuous && e.action !== "refill_at_aid" && e.action !== "restock_carry")
      .sort((a, b) => a.timeMinutes - b.timeMinutes);

    for (let gi = 1; gi < discreteSnapshot.length; gi++) {
      const gap = discreteSnapshot[gi].timeMinutes - discreteSnapshot[gi - 1].timeMinutes;
      if (gap <= maxGapMins) continue;

      const midMinutes = Math.round(
        (discreteSnapshot[gi - 1].timeMinutes + discreteSnapshot[gi].timeMinutes) / 2
      );
      const midSeg = findSegmentAtTime(segments, midMinutes);

      if (!midSeg || midSeg.terrain === "technical_descent") {
        warnings.push({
          type: "warning",
          code: "FUEL_GAP",
          message: `${gap}-min fuelling gap (${formatTime(discreteSnapshot[gi - 1].timeMinutes)}–${formatTime(discreteSnapshot[gi].timeMinutes)}) on technical terrain — cannot insert event.`,
          detail: "Fuel before or after this technical section instead.",
        });
        continue;
      }

      const midRule = TERRAIN_RULES[midSeg.terrain];
      const raceHoursAtMid = midMinutes / 60;
      const midPhase = getPhaseAtTime(midMinutes, totalRaceMinutes, strategy);

      const gapFillFuel = selectBestFuel(
        discreteInventory, inventoryUsage, midSeg.terrain, midRule, athlete,
        raceHoursAtMid, totalRaceHours, totalCaffeineMg, caffeineLimitMg,
        solidCarbsSoFar, liquidCarbsSoFar, false,
        midPhase, strategy,
      );

      if (!gapFillFuel) {
        warnings.push({
          type: "warning",
          code: "FUEL_GAP",
          message: `${gap}-min fuelling gap (${formatTime(discreteSnapshot[gi - 1].timeMinutes)}–${formatTime(discreteSnapshot[gi].timeMinutes)}) — no suitable fuel available to fill.`,
          detail: hasDrinkMix
            ? "Drink mix provides continuous carb coverage. Add more discrete items to eliminate the gap."
            : "Add more fuel items or a drink mix for continuous coverage.",
        });
        continue;
      }

      const servings = 1;
      const actualCarbs = Math.round(gapFillFuel.carbsPerServing * servings);
      const usedNow = inventoryUsage.get(gapFillFuel.id) ?? 0;
      inventoryUsage.set(gapFillFuel.id, usedNow + servings);
      totalCaffeineMg += Math.round(gapFillFuel.caffeinePerServingMg * servings);
      if (gapFillFuel.requiresChewing) solidCarbsSoFar += actualCarbs;
      else liquidCarbsSoFar += actualCarbs;

      const midKm = getKmAtTime(segments, midMinutes);
      schedule.push({
        id: `entry-${++entryIdx}-gap`,
        timeMinutes: midMinutes,
        distanceKm: Math.round(midKm * 10) / 10,
        segmentId: midSeg.id,
        terrain: midSeg.terrain,
        action: typeToAction(gapFillFuel.type),
        fuelItemId: gapFillFuel.id,
        fuelItemName: gapFillFuel.productName,
        quantity: servings,
        carbsG: actualCarbs,
        fluidMl: Math.round(gapFillFuel.fluidContributionMl * servings),
        sodiumMg: Math.round(gapFillFuel.sodiumPerServingMg * servings),
        caffeinesMg: Math.round(gapFillFuel.caffeinePerServingMg * servings),
        rationale: `Gap fill: ${gapFillFuel.productName} inserted to bridge ${gap}-min gap.`,
        priority: "recommended",
        isNearAidStation: false,
        warnings: [],
      });
    }
  }

  // ── Layer I: Output sanity pass ──────────────────────────────────────────
  // Validate event sizes across the full schedule. Discrete fuel events should
  // have carbsG within the [15, 45] g operational range. This catches unusual
  // inventory items with atypical carb values that the per-type bounds in
  // realisticEventSize() may not have constrained (e.g. custom products).
  for (const entry of schedule) {
    if (entry.isContinuous || entry.action === "refill_at_aid" || entry.action === "restock_carry") continue;
    if (entry.carbsG > 0 && (entry.carbsG < 12 || entry.carbsG > 48)) {
      warnings.push({
        type: "info",
        code: "EVENT_SIZE_BOUNDS",
        message: `Fuel event at ${formatTime(entry.timeMinutes)}: ${entry.fuelItemName ?? "item"} delivers ${entry.carbsG}g — outside the typical [15, 45g] range.`,
        detail: "Check this item's carbs-per-serving value in your inventory.",
      });
    }
  }

  schedule.sort((a, b) => a.timeMinutes - b.timeMinutes);
  checkInventoryExhaustion(inventory, inventoryUsage, warnings);

  return schedule;
}

// checkFuelGaps() superseded in v2.5 — gap detection and filling now happens inline
// in generateSchedule via the gap-fill guardrail block (see above).
// Retained as a named stub in case it is needed for external callers in future.
function checkFuelGaps(
  _schedule: FuelScheduleEntry[],
  _inventory: FuelItem[],
  _maxGapMins: number,
  _warnings: PlanWarning[],
): void {
  // No-op: replaced by inline gap-fill guardrail in generateSchedule (v2.5).
}

// ─── Carry plan generation ────────────────────────────────────────────────────
//
// Carry plans always follow the section structure (aid-station-bounded or inferred).
// Each section shows drink mix (in bottle) first, then discrete items.

function generateCarryPlans(
  segments: RouteSegment[],
  aidStations: AidStation[],
  schedule: FuelScheduleEntry[],
  inventory: FuelItem[],
  athlete: AthleteProfile,
  _assumptions: PlannerAssumptions,
): CarryPlan[] {
  const totalRaceMinutes = segments.reduce((a, s) => a + s.estimatedDurationMinutes, 0);
  const sections = buildSections(segments, aidStations, totalRaceMinutes);
  return sections.map(section => buildCarryPlan(section, schedule, inventory, athlete));
}

function buildCarryPlan(
  section: Section,
  schedule: FuelScheduleEntry[],
  inventory: FuelItem[],
  athlete: AthleteProfile,
): CarryPlan {
  const durationMins = section.toMinutes - section.fromMinutes;
  const durationHours = durationMins / 60;
  const targetFluidMl = Math.round(athlete.fluidTargetPerHourMl * durationHours);
  const targetCarbsG = Math.round(athlete.carbTargetPerHour * durationHours); // used for gap warning only

  const sectionSchedule = schedule.filter(
    e => e.timeMinutes >= section.fromMinutes
      && e.timeMinutes < section.toMinutes
      && e.action !== "refill_at_aid"
      && e.action !== "restock_carry"
  );

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

  // Sort: drink_mix first (in-bottle), then discrete items
  const items: CarryItem[] = Array.from(itemMap.entries())
    .map(([id, v]) => ({ fuelItemId: id, fuelItemName: v.name, quantity: v.qty, carbsG: v.carbs }))
    .sort((a, b) => {
      const aType = inventory.find(i => i.id === a.fuelItemId)?.type;
      const bType = inventory.find(i => i.id === b.fuelItemId)?.type;
      if (aType === "drink_mix" && bType !== "drink_mix") return -1;
      if (bType === "drink_mix" && aType !== "drink_mix") return 1;
      return 0;
    });

  const scheduledCarbs = sectionSchedule.reduce((sum, e) => sum + e.carbsG, 0);
  const warnings: string[] = [];

  if (targetFluidMl > 1500) {
    warnings.push(`${(targetFluidMl / 1000).toFixed(1)}L of fluid needed \u2014 plan for intermediate water access.`);
  }
  if (targetCarbsG > 0 && scheduledCarbs < targetCarbsG * 0.70) {
    warnings.push(`${scheduledCarbs}g carbs scheduled vs ${targetCarbsG}g target \u2014 check inventory quantities.`);
  }

  return {
    sectionId: `${section.fromKm.toFixed(1)}-${section.toKm.toFixed(1)}`,
    fromKm: section.fromKm,
    toKm: section.toKm,
    fromLabel: section.fromLabel,
    toLabel: section.toLabel,
    estimatedDurationMinutes: durationMins,
    fluidToCarryMl: targetFluidMl,
    carbsToCarryG: scheduledCarbs,
    itemsToCarry: items,
    warnings,
  };
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
  phase: RacePhase,
  strategy: RaceStrategyPlan,
): FuelItem | null {
  const isLateRace = phase === "late" ||
    (athlete.preferences.noSweetAfterHour != null &&
      raceHoursNow >= athlete.preferences.noSweetAfterHour);
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
    // ── Race strategy format gates ──────────────────────────────────────────
    if (!strategy.allowSolids[phase] && (item.type === "bar" || item.type === "real_food")) return false;
    if (!strategy.allowChews[phase] && item.type === "chew") return false;
    return true;
  });

  if (available.length === 0) return null;

  const totalCarbsSoFar = solidCarbsSoFar + liquidCarbsSoFar;
  const currentSolidRatio = totalCarbsSoFar > 0
    ? solidCarbsSoFar / totalCarbsSoFar : 0;
  const solidCapRatio = athlete.preferences.noSolids ? 0
    : athlete.preferences.lowSweetnessTolerance ? 0.40
    : 0.25;

  const scored = available.map((item) => {
    let score = 0;
    const isSolid = item.requiresChewing;

    // 1. Terrain suitability
    const prefIdx = rule.preferred.indexOf(item.type);
    if (prefIdx === 0) score += 20;
    else if (prefIdx === 1) score += 15;
    else if (prefIdx > 1) score += 8;

    // 2. Race-distance format bias
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
      if (isSolid) score += 8;
    }
    if (raceHoursNow > 6 && item.sweetnessScore >= 4) score -= 5;

    // 6. Carb density
    if (!isSolid && item.carbsPerServing >= 25) score += 5;

    // 7. Hydration contribution
    if (item.fluidContributionMl > 0) score += 3;

    // 8. User preferences
    if (athlete.preferences.drinkHeavy && item.type === "drink_mix") score += 20;
    if (athlete.preferences.gelLight && item.type === "gel") score -= 15;

    // 9. Solid cap guardrail
    if (isSolid && totalCarbsSoFar > 50 && currentSolidRatio >= solidCapRatio) {
      score -= 30;
    }

    // 10. Aid station proximity
    if (isNearAidStation && isSolid && !isLateRace && !isHighEffort) {
      score += 10;
    }

    // 11. Supply management
    const used = usage.get(item.id) ?? 0;
    const remaining = item.quantityAvailable - used;
    if (remaining <= 2) score -= 20;

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.item ?? null;
}

// ─── Plan summary ─────────────────────────────────────────────────────────────

function buildSummary(
  schedule: FuelScheduleEntry[], inventory: FuelItem[],
  totalRaceMinutes: number, athlete: AthleteProfile,
  segments: RouteSegment[], avgKcalPerHour: number,
  calibration: CalibrationResult,
  expectedTemperatureC?: number,
): PlanSummary {
  const totalRaceHours = totalRaceMinutes / 60;

  const fuelEvents = schedule.filter((e) => e.action !== "refill_at_aid" && e.action !== "restock_carry");

  const totalCarbsG = fuelEvents.reduce((a, e) => a + e.carbsG, 0);
  const totalFluidMl = fuelEvents.reduce((a, e) => a + e.fluidMl, 0);
  const totalSodiumMg = fuelEvents.reduce((a, e) => a + e.sodiumMg, 0);
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

  const hydrationGuidance = deriveHydrationGuidance(athlete, expectedTemperatureC, totalRaceHours);
  const electrolyteGuidance = deriveElectrolyteGuidance(athlete, expectedTemperatureC, totalRaceHours);

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
    hydrationGuidance,
    electrolyteGuidance,
  };
}

// ─── Hydration guidance ────────────────────────────────────────────────────────

function deriveHydrationGuidance(
  athlete: AthleteProfile,
  temperatureC: number | undefined,
  totalRaceHours: number,
): HydrationGuidance {
  const base = athlete.fluidTargetPerHourMl;
  const temp = temperatureC ?? 15;
  const isWarm = temp >= 25;
  const isHot = temp >= 30;

  let low = Math.round(base * 0.75);
  let high = Math.round(base * 1.25);

  if (isHot) {
    high = Math.round(base * 1.5);
    low = Math.round(base * 0.9);
  } else if (isWarm) {
    high = Math.round(base * 1.35);
    low = Math.round(base * 0.85);
  }

  low = Math.round(low / 50) * 50;
  high = Math.round(high / 50) * 50;
  if (high - low < 100) high = low + 100;
  if (low < 200) low = 200;
  if (high > 1500) high = 1500;

  let label: string;
  let note: string;
  if (isHot) {
    label = "Hot conditions \u2014 drink more";
    note = `Temperatures above 30\u00B0C significantly increase sweat losses. Aim for the upper end of this range and drink to thirst. Consider pre-loading with electrolytes.`;
  } else if (isWarm) {
    label = "Warm conditions";
    note = `Warmer weather means higher fluid needs. Drink consistently and don\u2019t wait until you feel thirsty \u2014 by then you\u2019re already behind.`;
  } else if (totalRaceHours >= 10) {
    label = "Long race \u2014 stay consistent";
    note = `Over a long race, small deficits add up. Drink regularly even if you don\u2019t feel thirsty, especially in the second half.`;
  } else {
    label = "Moderate conditions";
    note = `Drink to thirst and aim for regular small sips rather than large volumes at once. Adjust upward if conditions are warmer than expected.`;
  }

  return { rangeMlPerHour: [low, high], label, note, isWarmConditions: isWarm || isHot };
}

// ─── Electrolyte guidance ─────────────────────────────────────────────────────

function deriveElectrolyteGuidance(
  athlete: AthleteProfile,
  temperatureC: number | undefined,
  totalRaceHours: number,
): ElectrolyteGuidance {
  const temp = temperatureC ?? 15;
  const isWarm = temp >= 25;
  const isHot = temp >= 30;
  const isLong = totalRaceHours >= 6;
  const isVeryLong = totalRaceHours >= 12;
  const highSodiumTarget = athlete.sodiumTargetPerHourMg >= 800;

  let tier: "low" | "moderate" | "high";
  let label: string;
  let note: string;

  if (isHot || (isVeryLong && isWarm) || (isVeryLong && highSodiumTarget)) {
    tier = "high";
    label = "Strong electrolyte support recommended";
    note = `Consider sodium capsules or high-sodium drink mix throughout. You\u2019re likely to lose significant sodium through sweat over this duration and temperature.`;
  } else if (isWarm || isLong || highSodiumTarget) {
    tier = "moderate";
    label = "Moderate electrolyte support recommended";
    note = `A drink mix with electrolytes plus occasional sodium capsules should cover your needs. Pay attention if you\u2019re a salty sweater or start cramping.`;
  } else {
    tier = "low";
    label = "Basic electrolyte support is fine";
    note = `A standard sports drink mix should provide enough sodium for this duration and conditions. No need for additional supplementation unless you know you\u2019re a heavy sweater.`;
  }

  return { tier, label, note };
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateInventory(
  inventory: FuelItem[], athlete: AthleteProfile, totalRaceHours: number, warnings: PlanWarning[]
) {
  if (inventory.length === 0) {
    warnings.push({
      type: "error", code: "NO_INVENTORY",
      message: "No fuel items added.",
      detail: "Add at least one fuel item to generate a plan.",
    });
    return;
  }
  const totalCarbsAvailable = inventory.reduce(
    (a, item) => a + item.carbsPerServing * item.quantityAvailable, 0
  );
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

function checkInventoryExhaustion(
  inventory: FuelItem[], usage: Map<string, number>, warnings: PlanWarning[]
) {
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

function buildEntryWarnings(
  item: FuelItem, quantity: number, usage: Map<string, number>,
  athlete: AthleteProfile, raceHoursNow: number
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
    ws.push(`Sweet item after hour ${athlete.preferences.noSweetAfterHour} \u2014 may cause nausea.`);
  }
  return ws;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeToAction(type: FuelType): FuelAction {
  const map: Record<FuelType, FuelAction> = {
    gel: "consume_gel", chew: "consume_chew", bar: "consume_bar",
    real_food: "consume_food", drink_mix: "drink_fluid",
    capsule: "take_capsule", other: "consume_food",
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
  return `${h}h\u00a0${m}m`;
}
