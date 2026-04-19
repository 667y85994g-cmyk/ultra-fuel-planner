import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TerrainType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function formatPace(minPerKm: number): string {
  const mins = Math.floor(minPerKm);
  const secs = Math.round((minPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}/km`;
}

/**
 * Canonical terrain colours — earthy/muted, trail-register palette.
 * Mirror values in globals.css (.terrain-bar-*) and tailwind.config.js (terrain.*).
 * Canvas and SVG callers (print page) need resolved hex; all other callers
 * can be migrated to CSS vars in Prompt 03d.
 */
export function terrainColor(terrain: TerrainType): string {
  const colors: Record<TerrainType, string> = {
    flat_runnable:     "#cbb68a",
    rolling:           "#a88a5a",
    sustained_climb:   "#876a3c",
    steep_climb:       "#5c4824",
    runnable_descent:  "#6b5c4c",
    technical_descent: "#3d3228",
    recovery:          "#8a8074",
  };
  return colors[terrain] ?? "#a39a89"; // ink-4 as fallback
}

export function terrainBgClass(terrain: TerrainType): string {
  // Light-system earthy palette — bg tint from terrain color, readable ink-2 text.
  // Static strings so JIT picks them up (terrain.* defined in tailwind.config.js).
  const classes: Record<TerrainType, string> = {
    flat_runnable:     "bg-terrain-flat-runnable/20 text-ink-2 border-terrain-flat-runnable/40",
    rolling:           "bg-terrain-rolling/20 text-ink-2 border-terrain-rolling/40",
    sustained_climb:   "bg-terrain-sustained-climb/20 text-ink-2 border-terrain-sustained-climb/40",
    steep_climb:       "bg-terrain-steep-climb/20 text-ink-2 border-terrain-steep-climb/40",
    runnable_descent:  "bg-terrain-runnable-descent/20 text-ink-2 border-terrain-runnable-descent/40",
    technical_descent: "bg-terrain-technical-descent/20 text-ink-2 border-terrain-technical-descent/40",
    recovery:          "bg-terrain-recovery/20 text-ink-2 border-terrain-recovery/40",
  };
  return classes[terrain] ?? "bg-paper-3 text-ink-2 border-rule";
}

export function fuelTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    gel: "Gel",
    chew: "Chew",
    drink_mix: "Drink Mix",
    bar: "Bar",
    real_food: "Real Food",
    capsule: "Capsule",
    other: "Other",
  };
  return labels[type] ?? type;
}

export function fuelTypeIcon(type: string): string {
  const codes: Record<string, string> = {
    gel: "G",
    chew: "C",
    drink_mix: "~",
    bar: "B",
    real_food: "F",
    capsule: "Cap",
    other: "—",
  };
  return codes[type] ?? "—";
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function clampCarbs(carbsPerHour: number): number {
  return Math.min(120, Math.max(30, carbsPerHour));
}
