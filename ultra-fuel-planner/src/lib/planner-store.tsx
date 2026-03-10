"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react";
import type {
  StoredPlannerState,
  AthleteProfile,
  FuelItem,
  AidStation,
  ParsedRoute,
  PlannerOutput,
  EventPlan,
  PriorEffort,
  EventType,
  RacePriority,
  FinishTimeEstimation,
  GuidedProfile,
} from "@/types";
import { DEFAULT_ASSUMPTIONS } from "@/types";
import { loadState, saveState, defaultAthlete, defaultFuelInventory } from "./storage";
import { segmentRoute } from "./segmentation";
import { generatePlan } from "./fuelling-engine";
import { estimateFinishTime } from "./calibration-engine";
import { DEFAULT_GUIDED_PROFILE, applyGuidedProfile, guidedTemperature } from "./guided-profile";

// ─── State shape ──────────────────────────────────────────────────────────────

interface PlannerState extends StoredPlannerState {
  currentStep: number;
  isGenerating: boolean;
  isDirty: boolean;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type PlannerAction =
  | { type: "SET_STEP"; step: number }
  | { type: "SET_ATHLETE"; athlete: AthleteProfile }
  | { type: "SET_GUIDED_PROFILE"; profile: GuidedProfile }
  | { type: "SET_EVENT_META"; eventName: string; eventType?: EventType; racePriority?: RacePriority; raceStartTime?: string; expectedTemperatureC?: number; targetDistanceKm?: number; targetFinishTimeMinutes?: number }
  | { type: "SET_ROUTE"; route: ParsedRoute }
  | { type: "CLEAR_ROUTE" }
  | { type: "SET_FUEL_INVENTORY"; items: FuelItem[] }
  | { type: "ADD_FUEL_ITEM"; item: FuelItem }
  | { type: "UPDATE_FUEL_ITEM"; item: FuelItem }
  | { type: "REMOVE_FUEL_ITEM"; id: string }
  | { type: "SET_AID_STATIONS"; stations: AidStation[] }
  | { type: "ADD_AID_STATION"; station: AidStation }
  | { type: "REMOVE_AID_STATION"; id: string }
  | { type: "SET_PRIOR_EFFORTS"; efforts: PriorEffort[] }
  | { type: "ADD_PRIOR_EFFORT"; effort: PriorEffort }
  | { type: "REMOVE_PRIOR_EFFORT"; id: string }
  | { type: "SET_PLAN_OUTPUT"; output: PlannerOutput }
  | { type: "SET_GENERATING"; value: boolean }
  | { type: "LOAD_SAVED"; state: StoredPlannerState }
  | { type: "RESET" };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function plannerReducer(state: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.step };

    case "SET_ATHLETE":
      return { ...state, athlete: action.athlete, isDirty: true };

    case "SET_GUIDED_PROFILE":
      return { ...state, guidedProfile: action.profile, isDirty: true };

    case "SET_EVENT_META":
      return {
        ...state,
        eventName: action.eventName,
        eventType: action.eventType,
        racePriority: action.racePriority,
        raceStartTime: action.raceStartTime,
        expectedTemperatureC: action.expectedTemperatureC,
        targetDistanceKm: action.targetDistanceKm,
        targetFinishTimeMinutes: action.targetFinishTimeMinutes,
        isDirty: true,
      };

    case "SET_ROUTE":
      return { ...state, parsedRoute: action.route, isDirty: true };

    case "CLEAR_ROUTE":
      return { ...state, parsedRoute: undefined, isDirty: true };

    case "SET_FUEL_INVENTORY":
      return { ...state, fuelInventory: action.items, isDirty: true };

    case "ADD_FUEL_ITEM":
      return {
        ...state,
        fuelInventory: [...(state.fuelInventory ?? []), action.item],
        isDirty: true,
      };

    case "UPDATE_FUEL_ITEM":
      return {
        ...state,
        fuelInventory: (state.fuelInventory ?? []).map((item) =>
          item.id === action.item.id ? action.item : item
        ),
        isDirty: true,
      };

    case "REMOVE_FUEL_ITEM":
      return {
        ...state,
        fuelInventory: (state.fuelInventory ?? []).filter((item) => item.id !== action.id),
        isDirty: true,
      };

    case "SET_AID_STATIONS":
      return { ...state, aidStations: action.stations, isDirty: true };

    case "ADD_AID_STATION":
      return {
        ...state,
        aidStations: [...(state.aidStations ?? []), action.station],
        isDirty: true,
      };

    case "REMOVE_AID_STATION":
      return {
        ...state,
        aidStations: (state.aidStations ?? []).filter((s) => s.id !== action.id),
        isDirty: true,
      };

    case "SET_PRIOR_EFFORTS":
      return { ...state, priorEfforts: action.efforts, isDirty: true };

    case "ADD_PRIOR_EFFORT":
      return {
        ...state,
        priorEfforts: [...(state.priorEfforts ?? []), action.effort],
        isDirty: true,
      };

    case "REMOVE_PRIOR_EFFORT":
      return {
        ...state,
        priorEfforts: (state.priorEfforts ?? []).filter((e) => e.id !== action.id),
        isDirty: true,
      };

    case "SET_PLAN_OUTPUT":
      return { ...state, lastPlannerOutput: action.output, isDirty: false };

    case "SET_GENERATING":
      return { ...state, isGenerating: action.value };

    case "LOAD_SAVED": {
      // Migrate pre-v2.11 fuel items: quantity field removed from UI, sentinel 999 = unlimited.
      const rawInventory = action.state.fuelInventory ?? [];
      const migratedInventory = rawInventory.map(item =>
        item.quantityAvailable < 999 ? { ...item, quantityAvailable: 999 } : item
      );
      const didMigrate = rawInventory.some(item => item.quantityAvailable < 999);
      return { ...state, ...action.state, fuelInventory: migratedInventory, isDirty: didMigrate };
    }

    case "RESET":
      return { ...initialState };

    default:
      return state;
  }
}

const initialState: PlannerState = {
  currentStep: 0,
  isGenerating: false,
  isDirty: false,
  athlete: defaultAthlete(),
  guidedProfile: DEFAULT_GUIDED_PROFILE,
  eventName: "",
  fuelInventory: defaultFuelInventory(),
  aidStations: [],
  priorEfforts: [],
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface PlannerContextValue {
  state: PlannerState;
  dispatch: React.Dispatch<PlannerAction>;
  runPlanner: () => PlannerOutput | null;
}

const PlannerContext = createContext<PlannerContextValue | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(plannerReducer, initialState);

  // Load persisted state on mount
  useEffect(() => {
    const saved = loadState();
    if (Object.keys(saved).length > 0) {
      dispatch({ type: "LOAD_SAVED", state: saved });
    }
  }, []);

  // Persist state changes (debounced)
  useEffect(() => {
    if (!state.isDirty) return;
    const timer = setTimeout(() => {
      saveState({
        athlete: state.athlete,
        guidedProfile: state.guidedProfile,
        eventName: state.eventName,
        eventType: state.eventType,
        racePriority: state.racePriority,
        raceStartTime: state.raceStartTime,
        expectedTemperatureC: state.expectedTemperatureC,
        targetDistanceKm: state.targetDistanceKm,
        targetFinishTimeMinutes: state.targetFinishTimeMinutes,
        fuelInventory: state.fuelInventory,
        aidStations: state.aidStations,
        parsedRoute: state.parsedRoute,
        priorEfforts: state.priorEfforts,
        lastPlannerOutput: state.lastPlannerOutput,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [state]);

  const runPlanner = (): PlannerOutput | null => {
    if (!state.athlete || !state.fuelInventory) return null;

    // ── Resolve guided profile → athlete overrides ──────────────────────
    // When the runner used guided mode, map their plain-language choices
    // (fuelling level, experience, conditions) to numeric algorithm inputs.
    // Advanced mode leaves the stored athlete profile unchanged.
    const profile = state.guidedProfile ?? DEFAULT_GUIDED_PROFILE;
    const resolvedAthlete = applyGuidedProfile(state.athlete, profile);
    const resolvedTemperature = profile.useAdvancedInputs
      ? state.expectedTemperatureC
      : guidedTemperature(profile.expectedConditions) ?? state.expectedTemperatureC;

    // Re-segment route if needed
    let route = state.parsedRoute;
    if (route && route.segments.length === 0) {
      route = {
        ...route,
        segments: segmentRoute(route, DEFAULT_ASSUMPTIONS),
      };
    }

    // ── Finish-time estimation ──────────────────────────────────────────
    // When the user hasn't provided a target finish time, anchor on their
    // prior efforts to avoid the default 6.5 min/km flat pace producing
    // wildly optimistic estimates (e.g. 10h for an 18-hour runner).
    let derivedFinishMinutes = state.targetFinishTimeMinutes;
    let finishTimeEstimation: FinishTimeEstimation | undefined;

    if (!derivedFinishMinutes && (state.priorEfforts?.length ?? 0) > 0) {
      const targetDist = state.targetDistanceKm ?? route?.totalDistanceKm;
      if (targetDist && targetDist > 0) {
        finishTimeEstimation = estimateFinishTime(
          state.priorEfforts ?? [],
          targetDist,
          route?.totalAscentM,
          resolvedAthlete,
          state.racePriority,
        );
        derivedFinishMinutes = finishTimeEstimation.estimatedMinutes;
      }
    }

    // ── Scale segment durations ─────────────────────────────────────────
    // Whether the finish time is user-provided or estimated from prior
    // efforts, scale segment durations proportionally so totalRaceMinutes
    // in the fuelling engine matches the target/estimated time.
    if (route && derivedFinishMinutes && route.segments.length > 0) {
      const rawTotal = route.segments.reduce(
        (a, s) => a + s.estimatedDurationMinutes, 0
      );
      if (rawTotal > 0 && Math.abs(rawTotal - derivedFinishMinutes) > 10) {
        const scaleFactor = derivedFinishMinutes / rawTotal;
        route = {
          ...route,
          segments: route.segments.map(s => ({
            ...s,
            estimatedDurationMinutes: Math.round(
              s.estimatedDurationMinutes * scaleFactor
            ),
            estimatedPaceMinPerKm: Math.round(
              s.estimatedPaceMinPerKm * scaleFactor * 10
            ) / 10,
          })),
        };
      }
    }

    const eventPlan: EventPlan = {
      eventName: state.eventName ?? "My Race",
      eventType: state.eventType,
      racePriority: state.racePriority,
      targetDistanceKm: state.targetDistanceKm,
      targetFinishTimeMinutes: derivedFinishMinutes,
      expectedTemperatureC: resolvedTemperature,
      athlete: resolvedAthlete,
      route,
      fuelInventory: state.fuelInventory,
      aidStations: state.aidStations ?? [],
      assumptions: DEFAULT_ASSUMPTIONS,
      priorEfforts: state.priorEfforts ?? [],
    };

    const output = generatePlan(eventPlan);

    // Attach finish-time estimation metadata for the results page
    if (finishTimeEstimation) {
      output.finishTimeEstimation = finishTimeEstimation;
      output.summary.finishTimeEstimation = finishTimeEstimation;
    }

    dispatch({ type: "SET_PLAN_OUTPUT", output });
    saveState({ lastPlannerOutput: output });
    return output;
  };

  return (
    <PlannerContext.Provider value={{ state, dispatch, runPlanner }}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner(): PlannerContextValue {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used inside PlannerProvider");
  return ctx;
}
