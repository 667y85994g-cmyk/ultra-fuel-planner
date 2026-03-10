/**
 * Guided profile — maps user-friendly selectors to algorithm variables.
 *
 * This module bridges the two interaction modes in StepAthlete:
 *   - Guided mode: runners answer 3 plain-language questions
 *   - Advanced mode: runners enter numeric targets directly
 *
 * The guided → numeric mappings live here so they're shared between:
 *   - StepAthlete.tsx (displays labels and descriptions)
 *   - planner-store.tsx (applies the mapped values before running the planner)
 *
 * Algorithm files (fuelling-engine, calibration-engine, carb-target-engine)
 * never see the guided types — they only ever receive resolved AthleteProfile
 * values and the numeric expectedTemperatureC.
 */

import type {
  AthleteProfile,
  ExperienceLevel,
  FuellingLevel,
  ExpectedConditions,
  GuidedExperienceLevel,
  GuidedProfile,
} from "@/types";

// ─── Default guided profile ───────────────────────────────────────────────────

export const DEFAULT_GUIDED_PROFILE: GuidedProfile = {
  fuellingLevel: "not_sure",
  guidedExperience: "few_ultras",
  expectedConditions: "not_sure",
  useAdvancedInputs: false,
};

// ─── Experience level ─────────────────────────────────────────────────────────

export const GUIDED_EXPERIENCE_OPTIONS: {
  value: GuidedExperienceLevel;
  label: string;
  description: string;
  experienceLevel: ExperienceLevel;
}[] = [
  {
    value: "first_ultra",
    label: "First ultra",
    description: "Completing the race is the goal",
    experienceLevel: "novice",
  },
  {
    value: "few_ultras",
    label: "Done a few ultras",
    description: "Building experience and routines",
    experienceLevel: "intermediate",
  },
  {
    value: "very_experienced",
    label: "Very experienced",
    description: "Dialled-in system — know what works",
    experienceLevel: "experienced",
  },
];

// ─── Fuelling level ───────────────────────────────────────────────────────────

export const FUELLING_LEVEL_OPTIONS: {
  value: FuellingLevel;
  label: string;
  carbRange: string | null;
  note: string;
  carbsPerHour: number;
  maxCarbsPerHour: number;
}[] = [
  {
    value: "light",
    label: "Light",
    carbRange: "~40–50g carbs/hr",
    note: "Conservative approach",
    carbsPerHour: 45,
    maxCarbsPerHour: 60,
  },
  {
    value: "moderate",
    label: "Moderate",
    carbRange: "~50–65g carbs/hr",
    note: "Standard ultra fuelling",
    carbsPerHour: 57,
    maxCarbsPerHour: 75,
  },
  {
    value: "high",
    label: "High",
    carbRange: "~65–90g carbs/hr",
    note: "Trained gut, aggressive",
    carbsPerHour: 72,
    maxCarbsPerHour: 90,
  },
  {
    value: "not_sure",
    label: "Not sure",
    carbRange: null,
    note: "Planner will estimate from your experience and race length",
    carbsPerHour: 57,   // sensible default; carb-target-engine will refine
    maxCarbsPerHour: 80,
  },
];

// ─── Expected conditions ──────────────────────────────────────────────────────

export const CONDITIONS_OPTIONS: {
  value: ExpectedConditions;
  label: string;
  description: string;
  tempC: number | undefined;
}[] = [
  { value: "cool",     label: "Cool",     description: "Under 15°C",       tempC: 10    },
  { value: "moderate", label: "Moderate", description: "15–25°C",          tempC: 18    },
  { value: "hot",      label: "Hot",      description: "Above 25°C",       tempC: 28    },
  { value: "not_sure", label: "Not sure", description: "Planner uses 15°C default", tempC: undefined },
];

// ─── Apply guided profile to athlete ─────────────────────────────────────────

/**
 * Resolves a guided profile against a stored athlete profile,
 * returning an athlete suitable for passing to the fuelling engine.
 *
 * Called by runPlanner() in planner-store.tsx when guided mode is active.
 * Has no effect when useAdvancedInputs = true.
 */
export function applyGuidedProfile(
  athlete: AthleteProfile,
  profile: GuidedProfile,
): AthleteProfile {
  if (profile.useAdvancedInputs) return athlete;

  const expOption  = GUIDED_EXPERIENCE_OPTIONS.find((o) => o.value === profile.guidedExperience);
  const fuelOption = FUELLING_LEVEL_OPTIONS.find((o) => o.value === profile.fuellingLevel);

  return {
    ...athlete,
    experienceLevel:    expOption?.experienceLevel  ?? athlete.experienceLevel,
    carbTargetPerHour:  fuelOption?.carbsPerHour    ?? athlete.carbTargetPerHour,
    maxCarbsPerHour:    fuelOption?.maxCarbsPerHour ?? athlete.maxCarbsPerHour,
  };
}

/**
 * Returns the temperature (°C) implied by the conditions selector,
 * or undefined if the user selected "not sure".
 */
export function guidedTemperature(conditions: ExpectedConditions): number | undefined {
  return CONDITIONS_OPTIONS.find((o) => o.value === conditions)?.tempC;
}
