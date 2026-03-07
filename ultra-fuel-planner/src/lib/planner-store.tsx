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
} from "@/types";
import { DEFAULT_ASSUMPTIONS } from "@/types";
import { loadState, saveState, defaultAthlete, defaultFuelInventory } from "./storage";
import { segmentRoute } from "./segmentation";
import { generatePlan } from "./fuelling-engine";

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

    case "LOAD_SAVED":
      return { ...state, ...action.state, isDirty: false };

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

    // Re-segment route if needed
    let route = state.parsedRoute;
    if (route && route.segments.length === 0) {
      route = {
        ...route,
        segments: segmentRoute(route, DEFAULT_ASSUMPTIONS),
      };
    }

    const eventPlan: EventPlan = {
      eventName: state.eventName ?? "My Race",
      eventType: state.eventType,
      racePriority: state.racePriority,
      targetDistanceKm: state.targetDistanceKm,
      targetFinishTimeMinutes: state.targetFinishTimeMinutes,
      expectedTemperatureC: state.expectedTemperatureC,
      athlete: state.athlete,
      route,
      fuelInventory: state.fuelInventory,
      aidStations: state.aidStations ?? [],
      assumptions: DEFAULT_ASSUMPTIONS,
      priorEfforts: state.priorEfforts ?? [],
    };

    const output = generatePlan(eventPlan);
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
