"use client";

import type { PlannerOutput, FuelScheduleEntry, FuelAction } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTime, terrainBgClass, fuelTypeIcon } from "@/lib/utils";
import { terrainLabel } from "@/lib/segmentation";
import { MapPin, AlertTriangle } from "lucide-react";

interface Props {
  output: PlannerOutput;
  raceStartTime?: string; // "HH:MM"
}

/** Convert race-relative minutes to an absolute time-of-day string given a start time. */
function toTimeOfDay(raceMinutes: number, startTime: string): string {
  const [hStr, mStr] = startTime.split(":");
  const startTotalMins = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
  const totalMins = (startTotalMins + raceMinutes) % (24 * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

const ACTION_ICONS: Record<FuelAction, string> = {
  consume_gel: "💧",
  consume_chew: "🍬",
  consume_bar: "🍫",
  consume_food: "🍌",
  drink_fluid: "🫙",
  take_capsule: "💊",
  refill_at_aid: "🏁",
  restock_carry: "🎒",
};

function actionLabel(action: FuelAction, fuelName?: string): string {
  switch (action) {
    case "consume_gel": return `Gel: ${fuelName ?? "gel"}`;
    case "consume_chew": return `Chew: ${fuelName ?? "chew"}`;
    case "consume_bar": return `Bar: ${fuelName ?? "bar"}`;
    case "consume_food": return `Food: ${fuelName ?? "food"}`;
    case "drink_fluid": return fuelName ? `Drink: ${fuelName}` : "Drink fluid";
    case "take_capsule": return `Capsule: ${fuelName ?? "capsule"}`;
    case "refill_at_aid": return "Aid station";
    case "restock_carry": return "Restock carry";
    default: return fuelName ?? action;
  }
}

// Group entries by hour
function groupByHour(entries: FuelScheduleEntry[]): Map<number, FuelScheduleEntry[]> {
  const map = new Map<number, FuelScheduleEntry[]>();
  for (const entry of entries) {
    const hour = Math.floor(entry.timeMinutes / 60);
    const existing = map.get(hour) ?? [];
    map.set(hour, [...existing, entry]);
  }
  return map;
}

export function TimelineView({ output, raceStartTime }: Props) {
  const { schedule } = output;

  if (schedule.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="text-4xl">📋</div>
        <p className="text-stone-400">No schedule generated. Check your plan inputs.</p>
      </div>
    );
  }

  const grouped = groupByHour(schedule);
  const hours = Array.from(grouped.keys()).sort((a, b) => a - b);

  return (
    <div className="space-y-2">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-stone-50">Fuelling Timeline</h2>
        <p className="mt-1 text-sm text-stone-400">
          {schedule.length} fuelling events across your race. Times are estimates based on terrain and pace.
          {raceStartTime && (
            <span className="ml-1 text-amber-400">Start: {raceStartTime}</span>
          )}
        </p>
      </div>

      {hours.map((hour) => {
        const entries = grouped.get(hour)!;
        // Hour header label: show absolute time range if start time known
        const hourStartMins = hour * 60;
        const hourLabel = raceStartTime
          ? `${toTimeOfDay(hourStartMins, raceStartTime)} — ${toTimeOfDay(hourStartMins + 60, raceStartTime)}`
          : `Hour ${hour + 1}`;
        return (
          <div key={hour}>
            <div className="mb-2 flex items-center gap-3">
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                {hourLabel}
              </div>
              <div className="flex-1 h-px bg-stone-800" />
            </div>

            <div className="space-y-1.5 mb-4">
              {entries
                .sort((a, b) => a.timeMinutes - b.timeMinutes)
                .map((entry) => (
                  <TimelineEntry key={entry.id} entry={entry} raceStartTime={raceStartTime} />
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimelineEntry({ entry, raceStartTime }: { entry: FuelScheduleEntry; raceStartTime?: string }) {
  const isAid = entry.action === "refill_at_aid";
  const isRequired = entry.priority === "required";

  return (
    <div
      className={`flex items-start gap-3 rounded-lg px-4 py-3 transition-colors ${
        isAid
          ? "border border-amber-700/30 bg-amber-900/15"
          : isRequired
          ? "bg-stone-900/60"
          : "bg-stone-900/30"
      }`}
    >
      {/* Time */}
      <div className="flex-shrink-0 font-mono text-xs text-stone-500 pt-0.5">
        {raceStartTime ? (
          <div className="flex flex-col">
            <span className="text-stone-200">{toTimeOfDay(entry.timeMinutes, raceStartTime)}</span>
            <span className="text-stone-600">{formatTime(entry.timeMinutes)}</span>
          </div>
        ) : (
          <span className="w-12 block">{formatTime(entry.timeMinutes)}</span>
        )}
      </div>

      {/* Icon */}
      <div className="flex-shrink-0 text-lg leading-none mt-0.5">
        {ACTION_ICONS[entry.action] ?? "⚡"}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-sm font-medium ${
                isAid ? "text-amber-300" : "text-stone-200"
              }`}
            >
              {actionLabel(entry.action, entry.fuelItemName)}
              {entry.quantity > 1 && (
                <span className="text-stone-500"> ×{entry.quantity}</span>
              )}
            </span>

            {entry.terrain && entry.action !== "refill_at_aid" && (
              <Badge className={`${terrainBgClass(entry.terrain)} text-xs`}>
                {terrainLabel(entry.terrain)}
              </Badge>
            )}

            {isAid && (
              <MapPin className="h-3.5 w-3.5 text-amber-500" />
            )}
          </div>

          {/* Stats */}
          <div className="flex-shrink-0 flex gap-2 text-xs text-stone-500">
            {entry.carbsG > 0 && (
              <span className="text-amber-600 font-medium">{entry.carbsG}g</span>
            )}
            {entry.fluidMl > 0 && (
              <span className="text-blue-600">{entry.fluidMl}ml</span>
            )}
          </div>
        </div>

        {/* Rationale */}
        <p className="mt-0.5 text-xs text-stone-500 leading-relaxed line-clamp-1">
          {entry.rationale}
        </p>

        {/* Warnings */}
        {entry.warnings && entry.warnings.length > 0 && (
          <div className="mt-1 flex items-start gap-1.5">
            <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-amber-500">
              {entry.warnings[0]}
            </span>
          </div>
        )}

        {/* Distance */}
        <p className="mt-0.5 text-xs text-stone-600">
          km {entry.distanceKm.toFixed(1)}
        </p>
      </div>
    </div>
  );
}
