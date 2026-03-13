// ─── Core Data Models ─────────────────────────────────────────────────────────

export type ExperienceLevel = "novice" | "intermediate" | "experienced" | "elite";
export type RacePriority = "a_race" | "completion" | "training";

// ─── Guided Input Model ───────────────────────────────────────────────────────
//
// Three guided selectors replace raw numeric fields for runners who don't know
// their exact fuelling targets. Advanced users can toggle to direct numeric entry.
// See src/lib/guided-profile.ts for the mappings to algorithm variables.

export type FuellingLevel = "light" | "moderate" | "high" | "not_sure";
export type ExpectedConditions = "cool" | "moderate" | "hot" | "not_sure";
export type GuidedExperienceLevel = "first_ultra" | "few_ultras" | "very_experienced";

export interface GuidedProfile {
  fuellingLevel: FuellingLevel;
  guidedExperience: GuidedExperienceLevel;
  expectedConditions: ExpectedConditions;
  useAdvancedInputs: boolean;
}
export type EventType = "trail_marathon" | "ultra_50k" | "ultra_50m" | "ultra_100k" | "ultra_100m" | "mountain_ultra" | "other";

export interface AthleteProfile {
  name?: string;
  bodyweightKg: number;
  experienceLevel: ExperienceLevel;
  carbTargetPerHour: number;      // g/hr — may be overridden by calibration
  maxCarbsPerHour: number;        // upper gut tolerance limit
  fluidTargetPerHourMl: number;
  sodiumTargetPerHourMg: number;
  caffeinePreference: "none" | "limited" | "normal";
  caffeineMaxMg?: number;         // total race max
  preferences: AthletePreferences;
}

export interface AthletePreferences {
  noSolids: boolean;
  noSweetAfterHour?: number;      // avoid sweet products after X hours
  drinkHeavy: boolean;            // prefer liquid-based fuelling
  gelLight: boolean;              // minimise gels
  lowSweetnessTolerance: boolean; // prefers savoury / mild flavours
  exclusions: string[];           // product names or types to exclude
}

// ─── Prior Effort (Calibration Data) ─────────────────────────────────────────

export interface PriorEffort {
  id: string;
  label: string;                  // "CCC 2024", "Training run 30k"
  distanceKm: number;
  durationMinutes: number;
  elevationGainM: number;
  avgHeartRate?: number;          // bpm
  caloriesBurned?: number;        // from watch/device
  avgPaceMinPerKm?: number;
  weather?: string;               // "hot", "cool", "rain", etc.
  fuellingNotes?: string;         // what they ate
  whatWorked?: string;
  whatDidntWork?: string;
}

// ─── Carb Target Engine — Layer 2 ────────────────────────────────────────────
//
// Carbohydrate targets are determined by RACE DURATION and RUNNER CONTEXT,
// never by calories burned. See src/lib/carb-target-engine.ts.

export interface CarbTargetRationale {
  primaryDriver: "race_duration";
  durationBandLabel: string;        // e.g. "6–10 hour event"
  experienceAdjustment: number;     // signed g/hr delta applied
  racePriorityAdjustment: number;   // signed g/hr delta applied
  gutToleranceCap?: number;         // set if gut ceiling was hit
  notes: string[];
}

export interface CarbTargetRecommendation {
  recommendedRangeGPerHour: [number, number]; // [low, high]
  workingTargetGPerHour: number;              // single working value
  rationale: CarbTargetRationale;
}

// ─── Layer 4 — Learning Architecture Hooks ───────────────────────────────────
//
// These types support future post-race feedback and plan refinement.
// Not yet used in the active planner — reserved for v2+ learning features.

export interface ExecutionAdjustmentNotes {
  targetedCarbGPerHour: number;
  actualCarbGPerHour?: number;        // filled post-race
  gutFeelingDuring?: 1 | 2 | 3 | 4 | 5; // 1 = poor, 5 = great
  adjustmentsMade?: string[];         // e.g. "reduced in late race"
}

export interface PostRaceFeedback {
  effortId: string;                   // links to a PriorEffort
  perceivedEffort?: 1 | 2 | 3 | 4 | 5;
  gutIssues?: boolean;
  gutIssueDetails?: string;
  fuellingWentToTarget?: boolean;
  carbsWereAdequate?: boolean;
  fluidWasAdequate?: boolean;
  whatWouldChangeNextTime?: string;
}

// ─── Calibration Result ──────────────────────────────────────────────────────

export type ConfidenceLevel = "low" | "moderate" | "high";
export type BurnRateBand = "lower" | "middle" | "higher";
export type CalibrationQuality = "none" | "limited" | "good" | "strong";

export interface CalibrationResult {
  estimatedKcalPerHour: number;
  kcalPerHourRange: [number, number]; // low, high
  suggestedCarbRangeGPerHour: [number, number]; // low, high
  workingCarbTargetGPerHour: number;
  confidenceLevel: ConfidenceLevel;
  confidenceNotes: string[];
  burnRateBand: BurnRateBand;
  assumptionsMade: string[];
  priorEffortsUsed: number;
}

export interface PlanConfidence {
  overall: ConfidenceLevel;
  calibrationQuality: CalibrationQuality;
  notes: string[];
}

// ─── Finish Time Estimation ─────────────────────────────────────────────────

export interface FinishTimeEstimation {
  estimatedMinutes: number;
  rangeMinutes: [number, number]; // [optimistic, conservative]
  confidence: ConfidenceLevel;
  method: "prior_effort_anchor" | "pace_based" | "fallback";
  explanation: string[];
}

// ─── Event Plan ───────────────────────────────────────────────────────────────

export interface EventPlan {
  eventName: string;
  eventType?: EventType;
  racePriority?: RacePriority;
  targetDistanceKm?: number;
  targetFinishTimeMinutes?: number;
  estimatedPaceMinPerKm?: number;
  expectedTemperatureC?: number;
  athlete: AthleteProfile;
  route?: ParsedRoute;
  fuelInventory: FuelItem[];
  aidStations: AidStation[];
  assumptions: PlannerAssumptions;
  priorEfforts: PriorEffort[];
  calibration?: CalibrationResult;
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
  effortLevel: 1 | 2 | 3 | 4 | 5;
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
  elevationProfile: ElevationPoint[];
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
  carbsPerServing: number;
  sodiumPerServingMg: number;
  fluidContributionMl: number;
  caffeinePerServingMg: number;
  caloriesPerServing: number;
  servingSizeG?: number;
  easyOnClimbs: boolean;
  easyAtHighEffort: boolean;
  requiresChewing: boolean;
  sweetnessScore: 1 | 2 | 3 | 4 | 5;
  lateRaceToleranceScore: 1 | 2 | 3 | 4 | 5;
  quantityAvailable: number;
  quantityUsed?: number;
  notes?: string;
}

// ─── Aid Stations ─────────────────────────────────────────────────────────────

export interface AidStation {
  id: string;
  name: string;
  distanceKm: number;
  available: AidStationSupply;
  fullRefillPossible: boolean;
  crewAccess?: boolean;
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
  timeMinutes: number;
  distanceKm: number;
  segmentId: string;
  terrain: TerrainType;
  action: FuelAction;
  fuelItemId?: string;
  fuelItemName?: string;
  quantity: number;
  carbsG: number;
  fluidMl: number;
  sodiumMg: number;
  caffeinesMg: number;
  rationale: string;
  priority: "required" | "recommended" | "optional";
  isNearAidStation?: boolean;
  isContinuous?: boolean;       // drink mix entries: sip continuously over section (not a point event)
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
  /** Total ascent across all segments in this section (metres, rounded). */
  ascentM: number;
  /** Total descent across all segments in this section (metres, rounded). */
  descentM: number;
  /** Time-weighted dominant terrain type for this section. */
  dominantTerrain: TerrainType;
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
  confidence: PlanConfidence;
  finishTimeEstimation?: FinishTimeEstimation;
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
  coverageScore: number;
  estimatedTotalKcal?: number;
  avgKcalPerHour?: number;
  carbTargetRangeGPerHour?: [number, number];
  workingCarbTarget?: number;
  burnRateBand?: BurnRateBand;
  finishTimeEstimation?: FinishTimeEstimation;
  fuelFormatNotes?: string[];
  hydrationGuidance?: HydrationGuidance;
  electrolyteGuidance?: ElectrolyteGuidance;
}

// ─── Hydration & Electrolyte Guidance ────────────────────────────────────────

export interface HydrationGuidance {
  rangeMlPerHour: [number, number]; // e.g. [450, 650]
  label: string;                     // e.g. "Moderate conditions"
  note: string;                      // plain-English advice
  isWarmConditions: boolean;
}

export type ElectrolyteTier = "low" | "moderate" | "high";

export interface ElectrolyteGuidance {
  tier: ElectrolyteTier;
  label: string;                     // e.g. "Moderate electrolyte support recommended"
  note: string;                      // contextual advice
}

export interface SegmentRecommendation {
  segmentId: string;
  terrain: TerrainType;
  terrainLabel: string;
  primaryFuelType: FuelType | "fluid_only";
  avoid: FuelType[];
  rationale: string;
  timingNote?: string;
  estimatedKcalPerHour?: number;
  fuellingFormat?: string;
  derivedFuelIntervalMinutes?: number;
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
  paceClimbMinPerKmPer100mGain: number;
  paceDescentFactor: number;
  minFuelIntervalMinutes: number;
  maxItemsPerFuelStop: number;
  earlyRaceHours: number;
  lateRaceHours: number;
  fluidPerHourClimbBonus: number;
  sodiumPerLitreMg: number;
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
  guidedProfile?: GuidedProfile;
  eventName?: string;
  eventType?: EventType;
  racePriority?: RacePriority;
  raceStartTime?: string;
  expectedTemperatureC?: number;
  targetDistanceKm?: number;
  targetFinishTimeMinutes?: number;
  fuelInventory?: FuelItem[];
  aidStations?: AidStation[];
  parsedRoute?: ParsedRoute;
  priorEfforts?: PriorEffort[];
  lastPlannerOutput?: PlannerOutput;
}
