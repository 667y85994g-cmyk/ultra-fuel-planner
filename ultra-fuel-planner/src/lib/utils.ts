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

export function terrainColor(terrain: TerrainType): string {
  const colors: Record<TerrainType, string> = {
    flat_runnable: "#4a7c59",
    rolling: "#6b8f4e",
    sustained_climb: "#c4773a",
    steep_climb: "#c4463a",
    runnable_descent: "#5b7fa6",
    technical_descent: "#8b6bb1",
    recovery: "#4a7c7c",
  };
  return colors[terrain] ?? "#6b7280";
}

export function terrainBgClass(terrain: TerrainType): string {
  const classes: Record<TerrainType, string> = {
    flat_runnable: "bg-green-800/20 text-green-300 border-green-700/30",
    rolling: "bg-lime-800/20 text-lime-300 border-lime-700/30",
    sustained_climb: "bg-orange-800/20 text-orange-300 border-orange-700/30",
    steep_climb: "bg-red-800/20 text-red-300 border-red-700/30",
    runnable_descent: "bg-blue-800/20 text-blue-300 border-blue-700/30",
    technical_descent: "bg-purple-800/20 text-purple-300 border-purple-700/30",
    recovery: "bg-teal-800/20 text-teal-300 border-teal-700/30",
  };
  return classes[terrain] ?? "bg-stone-700/20 text-stone-300 border-stone-700/30";
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
  const icons: Record<string, string> = {
    gel: "💧",
    chew: "🍬",
    drink_mix: "🫙",
    bar: "🍫",
    real_food: "🍌",
    capsule: "💊",
    other: "📦",
  };
  return icons[type] ?? "📦";
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function clampCarbs(carbsPerHour: number): number {
  return Math.min(120, Math.max(30, carbsPerHour));
}
