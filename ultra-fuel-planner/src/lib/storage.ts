import type { StoredPlannerState, FuelItem, AthleteProfile } from "@/types";
import { generateId } from "./utils";

const STORAGE_KEY = "ufp_state_v2";
const LEGACY_KEY = "ufp_state_v1";

export function loadState(): StoredPlannerState {
  if (typeof window === "undefined") return {};
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_KEY);
      if (raw) {
        localStorage.setItem(STORAGE_KEY, raw);
        localStorage.removeItem(LEGACY_KEY);
      }
    }
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredPlannerState;
    if (parsed.athlete && !parsed.athlete.experienceLevel) {
      parsed.athlete.experienceLevel = "intermediate";
    }
    if (parsed.athlete?.preferences && parsed.athlete.preferences.lowSweetnessTolerance === undefined) {
      parsed.athlete.preferences.lowSweetnessTolerance = false;
    }
    return parsed;
  } catch {
    return {};
  }
}

export function saveState(state: Partial<StoredPlannerState>): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...state }));
  } catch { /* localStorage may be unavailable */ }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_KEY);
}

// ─── Default seed data ────────────────────────────────────────────────────────

export function defaultFuelInventory(): FuelItem[] {
  return [
    {
      id: generateId(), productName: "SIS Go Isotonic Gel", brand: "Science in Sport",
      type: "gel", carbsPerServing: 22, sodiumPerServingMg: 11, fluidContributionMl: 60,
      caffeinePerServingMg: 0, caloriesPerServing: 87, servingSizeG: 60,
      easyOnClimbs: true, easyAtHighEffort: true, requiresChewing: false,
      sweetnessScore: 3, lateRaceToleranceScore: 4, quantityAvailable: 8,
    },
    {
      id: generateId(), productName: "Torq Energy Chew", brand: "Torq",
      type: "chew", carbsPerServing: 30, sodiumPerServingMg: 65, fluidContributionMl: 0,
      caffeinePerServingMg: 0, caloriesPerServing: 120, servingSizeG: 45,
      easyOnClimbs: false, easyAtHighEffort: false, requiresChewing: true,
      sweetnessScore: 4, lateRaceToleranceScore: 3, quantityAvailable: 6,
    },
    {
      id: generateId(), productName: "Maurten Drink Mix 320", brand: "Maurten",
      type: "drink_mix", carbsPerServing: 80, sodiumPerServingMg: 500, fluidContributionMl: 500,
      caffeinePerServingMg: 0, caloriesPerServing: 320, servingSizeG: 80,
      easyOnClimbs: true, easyAtHighEffort: true, requiresChewing: false,
      sweetnessScore: 2, lateRaceToleranceScore: 5, quantityAvailable: 4,
    },
    {
      id: generateId(), productName: "Clif Bar", brand: "Clif",
      type: "bar", carbsPerServing: 45, sodiumPerServingMg: 170, fluidContributionMl: 0,
      caffeinePerServingMg: 0, caloriesPerServing: 240, servingSizeG: 68,
      easyOnClimbs: false, easyAtHighEffort: false, requiresChewing: true,
      sweetnessScore: 3, lateRaceToleranceScore: 2, quantityAvailable: 4,
    },
    {
      id: generateId(), productName: "Banana (half)", brand: "",
      type: "real_food", carbsPerServing: 15, sodiumPerServingMg: 0, fluidContributionMl: 40,
      caffeinePerServingMg: 0, caloriesPerServing: 60, servingSizeG: 60,
      easyOnClimbs: false, easyAtHighEffort: false, requiresChewing: true,
      sweetnessScore: 2, lateRaceToleranceScore: 5, quantityAvailable: 6,
    },
    {
      id: generateId(), productName: "Caffeine Gel (SIS Caffeine)", brand: "Science in Sport",
      type: "gel", carbsPerServing: 22, sodiumPerServingMg: 11, fluidContributionMl: 60,
      caffeinePerServingMg: 75, caloriesPerServing: 87, servingSizeG: 60,
      easyOnClimbs: true, easyAtHighEffort: true, requiresChewing: false,
      sweetnessScore: 3, lateRaceToleranceScore: 3, quantityAvailable: 3,
    },
  ];
}

export function defaultAthlete(): AthleteProfile {
  return {
    bodyweightKg: 70,
    experienceLevel: "intermediate",
    carbTargetPerHour: 60,
    maxCarbsPerHour: 80,
    fluidTargetPerHourMl: 600,
    sodiumTargetPerHourMg: 500,
    caffeinePreference: "limited",
    caffeineMaxMg: 200,
    preferences: {
      noSolids: false,
      noSweetAfterHour: 7,
      drinkHeavy: false,
      gelLight: false,
      lowSweetnessTolerance: false,
      exclusions: [],
    },
  };
}
