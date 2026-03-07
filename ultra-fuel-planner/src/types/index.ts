// ─── Core Data Models ─────────────────────────────────────────────────────────

export interface AthleteProfile {
  name?: string;
  bodyweightKg: number;
  carbTargetPerHour: number;      // g/hr the athlete is trained to absorb
  maxCarbsPerHour: number;        // upper tolerance limit
  fluidTargetPerHourMl: number;
  sodiumTargetPerHourMg: number;
  caffeinePreference: "none" | "limited" | "normal";
  caffeineMaxMg?: number;         // total race max
  preferences: AthletePreferences;
  trainingMetrics?: TrainingMetrics;
}

export interface AthletePreferences {
  noSolids: boolean;
  noSweetAfterHour?: number;      // avoid sweet products after X hours
  drinkHeavy: boolean;            // prefer liquid-based fuelling
  gelLight: boolean;              // minimise gels
  exclusions: string[];           // product names or types to exclude
}

/**
 * Athlete energy system inputs.
 * Used by the Minetti / Brooks-Mercier energy model to calculate:
 *   - Caloric burn rate per segment (kcal/hr)
 *   - CHO oxidation fraction (% calories from carbs)
 *   - Derived carb target (g/hr) and fuelling interval (minutes)
 */
export type RaceIntensity = "easy" | "moderate" | "hard" | "race";
export type FatAdaptation  = "low" | "medium" | "high";

export interface TrainingMetrics {
  // Primary driver: effort level → % VO₂max → CHO fraction + fuelling interval
  raceIntensity?: RaceIntensity;
  // Fat adaptation: LCHF / low-carb training shifts CHO/fat ratio at any intensity
  fatAdaptation?: FatAdaptation;
  // Optional calibration: from Garmin Connect, Polar, Whoop, etc.
  vo2MaxEstimate?: number;                     // ml/kg/min, typically 35–80
  // Hydration: adjusts fluid target if sweat rate > current setting
  hydrationLossEstimateMlPerHour?: number;     // ml/hr, from wearable sweat data
}

// ─── Event Plan ───────────────────────────────────────────────────────────────

export interface EventPlan {
  eventName: string;
  targetDistanceKm?: number;
  targetFinishTimeMinutes?: number;
  estimatedPaceMinPerKm?: number;
  athlete: AthleteProfile;
  route?: ParsedRoute;
  fuelInventory: FuelItem[];
  aidStations: AidStation[];
  assumptions: PlannerAssumptions;
}

// ─── Route & Segments ─────────────────────────────────────────────────────────

export interface RoutePoint {
  lat: number;
  lon: number;
  elevationM: number;
  distanceFromStartKm: number;
  cumulativeAscentM: number;
  cumulativeDescentM: number;
}

export type TerrainType =
  | "flat_runnable"
  | "rolling"
  | "sustained_climb"
  | "steep_climb"
  | "technical_descent"
  | "runnable_descent"
  | "recovery";

export interface RouteSegment {
  id: string;
  name: string;
  startKm: number;
  endKm: number;
  distanceKm: number;
  startElevationM: number;
  endElevationM: number;
  ascentM: number;
  descentM: number;
  avgGradientPct: number;
  maxGradientPct: number;
  terrain: TerrainType;
  estimatedDurationMinutes: number;
  estimatedPaceMinPerKm: number;
  effortLevel: 1 | 2 | 3 | 4 | 5; // 1=easy, 5=max effort
  notes?: string;
}

export interface ParsedRoute {
  totalDistanceKm: number;
  totalAscentM: number;
  totalDescentM: number;
  minElevationM: number;
  maxElevationM: number;
  points: RoutePoint[];
  segments: RouteSegment[];
  elevationProfile: ElevationPoint[]; // downsampled for charting
  fileName?: string;
}

export interface ElevationPoint {
  distanceKm: number;
  elevationM: number;
  gradient?: number;
}

// ─── Fuel Inventory ───────────────────────────────────────────────────────────

export type FuelType =
  | "gel"
  | "chew"
  | "drink_mix"
  | "bar"
  | "real_food"
  | "capsule"
  | "other";

export interface FuelItem {
  id: string;
  productName: string;
  brand?: string;
  type: FuelType;
  carbsPerServing: number;         // g
  sodiumPerServingMg: number;
  fluidContributionMl: number;     // if already dissolved in liquid
  caffeinePerServingMg: number;
  caloriesPerServing: number;
  servingSizeG?: number;
  easyOnClimbs: boolean;           // can be consumed hands-free / no chewing
  easyAtHighEffort: boolean;
  requiresChewing: boolean;
  sweetnessScore: 1 | 2 | 3 | 4 | 5;
  lateRaceToleranceScore: 1 | 2 | 3 | 4 | 5; // 1=poor, 5=excellent
  quantityAvailable: number;       // total servings
  quantityUsed?: number;           // calculated by planner
  notes?: string;
}

// ─── Aid Stations ─────────────────────────────────────────────────────────────

export interface AidStation {
  id: string;
  name: string;
  distanceKm: number;
  available: AidStationSupply;
  fullRefillPossible: boolean;
  notes?: string;
}

export interface AidStationSupply {
  water: boolean;
  sportsDrink: boolean;
  gels: boolean;
  realFood: boolean;
  customItems: string[];
}

// ─── Fuel Schedule ────────────────────────────────────────────────────────────

export interface FuelScheduleEntry {
  id: string;
  timeMinutes: number;             // minutes from race start
  distanceKm: number;
  segmentId: string;
  terrain: TerrainType;
  action: FuelAction;
  fuelItemId?: string;
  fuelItemName?: string;
  quantity: number;                // servings
  carbsG: number;
  fluidMl: number;
  sodiumMg: number;
  caffeinesMg: number;
  rationale: string;               // human-readable explanation
  priority: "required" | "recommended" | "optional";
  isNearAidStation?: boolean;
  warnings?: string[];
}

export type FuelAction =
  | "consume_gel"
  | "consume_chew"
  | "consume_bar"
  | "consume_food"
  | "drink_fluid"
  | "take_capsule"
  | "refill_at_aid"
  | "restock_carry";

// ─── Carry Plan ───────────────────────────────────────────────────────────────

export interface CarryPlan {
  sectionId: string;
  fromKm: number;
  toKm: number;
  fromLabel: string;
  toLabel: string;
  estimatedDurationMinutes: number;
  fluidToCarryMl: number;
  carbsToCarryG: number;
  itemsToCarry: CarryItem[];
  refillInstructions?: string;
  warnings: string[];
}

export interface CarryItem {
  fuelItemId: string;
  fuelItemName: string;
  quantity: number;
  carbsG: number;
  notes?: string;
}

// ─── Planner Output ───────────────────────────────────────────────────────────

export interface PlannerOutput {
  eventPlan: EventPlan;
  summary: PlanSummary;
  schedule: FuelScheduleEntry[];
  carryPlans: CarryPlan[];
  segmentRecommendations: SegmentRecommendation[];
  warnings: PlanWarning[];
  generatedAt: string;
}

export interface PlanSummary {
  totalRaceDurationMinutes: number;
  avgCarbsPerHour: number;
  avgFluidPerHourMl: number;
  avgSodiumPerHourMg: number;
  totalCarbsG: number;
  totalFluidMl: number;
  totalSodiumMg: number;
  totalCaffeinesMg: number;
  itemTotals: Record<string, { name: string; quantity: number; carbsG: number }>;
  coverageScore: number;           // 0–100, how well inventory covers targets
  // Energy model outputs (populated when raceIntensity is set)
  estimatedTotalKcal?: number;     // total gross caloric expenditure
  avgKcalPerHour?: number;         // average kcal/hr across race
  avgChoBurnGPerHour?: number;     // average endogenous CHO burn rate (g/hr)
}

export interface SegmentRecommendation {
  segmentId: string;
  terrain: TerrainType;
  terrainLabel: string;
  primaryFuelType: FuelType | "fluid_only";
  avoid: FuelType[];
  rationale: string;
  timingNote?: string;
  // Energy model outputs
  estimatedKcalPerHour?: number;        // caloric burn rate for this segment
  choBurnGPerHour?: number;             // endogenous CHO oxidation rate
  derivedFuelIntervalMinutes?: number;  // interval implied by 300 kcal trigger
}

export interface PlanWarning {
  type: "error" | "warning" | "info";
  code: string;
  message: string;
  detail?: string;
}

// ─── Planner Assumptions ──────────────────────────────────────────────────────

export interface PlannerAssumptions {
  paceFlatMinPerKm: number;
  paceClimbMinPerKmPer100mGain: number; // Naismith's rule factor
  paceDescentFactor: number;            // multiplier vs flat
  minFuelIntervalMinutes: number;       // minimum gap between fuelling events
  maxItemsPerFuelStop: number;          // max different items at once
  earlyRaceHours: number;               // "early" phase definition
  lateRaceHours: number;                // when "late race" simplification kicks in
  fluidPerHourClimbBonus: number;       // extra ml/hr on big climbs
  sodiumPerLitreMg: number;             // sweat sodium assumption
}

export const DEFAULT_ASSUMPTIONS: PlannerAssumptions = {
  paceFlatMinPerKm: 6.5,
  paceClimbMinPerKmPer100mGain: 1.0,
  paceDescentFactor: 0.85,
  minFuelIntervalMinutes: 15,
  maxItemsPerFuelStop: 2,
  earlyRaceHours: 2,
  lateRaceHours: 6,
  fluidPerHourClimbBonus: 100,
  sodiumPerLitreMg: 700,
};

// ─── Local Storage ────────────────────────────────────────────────────────────

export interface StoredPlannerState {
  athlete?: AthleteProfile;
  eventName?: string;
  raceStartTime?: string;        // "HH:MM" e.g. "06:30"
  targetDistanceKm?: number;
  targetFinishTimeMinutes?: number;
  fuelInventory?: FuelItem[];
  aidStations?: AidStation[];
  parsedRoute?: ParsedRoute;
  lastPlannerOutput?: PlannerOutput;
}
