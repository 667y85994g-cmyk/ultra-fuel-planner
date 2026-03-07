"use client";

import { useState } from "react";
import { usePlanner } from "@/lib/planner-store";
import type { AthleteProfile, TrainingMetrics, RaceIntensity, FatAdaptation } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, ChevronDown, ChevronUp, Flame } from "lucide-react";
import {
  caloricBurnRate,
  fuellingIntervalMinutes,
  derivedCarbGPerHour,
  INTENSITY_VO2MAX,
  INTENSITY_LABELS,
  INTENSITY_DESCRIPTIONS,
} from "@/lib/energy-model";

interface Props {
  onNext: () => void;
}

export function StepAthlete({ onNext }: Props) {
  const { state, dispatch } = usePlanner();
  const athlete = state.athlete!;
  const [showEnergyModel, setShowEnergyModel] = useState(
    !!athlete.trainingMetrics?.raceIntensity
  );

  const update = (patch: Partial<AthleteProfile>) => {
    dispatch({ type: "SET_ATHLETE", athlete: { ...athlete, ...patch } });
  };

  const updatePref = (key: string, value: unknown) => {
    update({
      preferences: { ...athlete.preferences, [key]: value },
    });
  };

  const updateMetrics = (patch: Partial<TrainingMetrics>) => {
    update({
      trainingMetrics: { ...(athlete.trainingMetrics ?? {}), ...patch },
    });
  };

  const updateEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    dispatch({
      type: "SET_EVENT_META",
      eventName: fd.get("eventName") as string,
      raceStartTime: (fd.get("raceStartTime") as string) || undefined,
      targetDistanceKm: fd.get("targetDistanceKm")
        ? Number(fd.get("targetDistanceKm"))
        : undefined,
      targetFinishTimeMinutes: fd.get("finishHours") || fd.get("finishMins")
        ? Number(fd.get("finishHours") || 0) * 60 +
          Number(fd.get("finishMins") || 0)
        : undefined,
    });
    onNext();
  };

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-50">
          Tell us about your event and targets
        </h1>
        <p className="mt-2 text-stone-400">
          These inputs set your hourly targets. They are assumptions — you can
          adjust them later.
        </p>
      </div>

      <form onSubmit={updateEvent} className="space-y-6">
        {/* Event details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="eventName">Event name</Label>
              <Input
                id="eventName"
                name="eventName"
                defaultValue={state.eventName}
                placeholder="e.g. UTMB, Lakeland 50, Hardmoors 110"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="targetDistanceKm">Target distance (km)</Label>
              <Input
                id="targetDistanceKm"
                name="targetDistanceKm"
                type="number"
                min={0}
                step={0.1}
                defaultValue={state.targetDistanceKm}
                placeholder="e.g. 100"
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-stone-500">
                Leave blank to use GPX distance
              </p>
            </div>
            <div>
              <Label>Target finish time</Label>
              <div className="mt-1.5 flex gap-2">
                <div className="flex-1">
                  <Input
                    name="finishHours"
                    type="number"
                    min={0}
                    max={60}
                    defaultValue={
                      state.targetFinishTimeMinutes
                        ? Math.floor(state.targetFinishTimeMinutes / 60)
                        : undefined
                    }
                    placeholder="Hours"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    name="finishMins"
                    type="number"
                    min={0}
                    max={59}
                    defaultValue={
                      state.targetFinishTimeMinutes
                        ? state.targetFinishTimeMinutes % 60
                        : undefined
                    }
                    placeholder="Mins"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="raceStartTime">Race start time</Label>
              <Input
                id="raceStartTime"
                name="raceStartTime"
                type="time"
                defaultValue={state.raceStartTime ?? ""}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-stone-500">
                Shows real clock times in your schedule
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Athlete physiology */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Athlete Inputs</CardTitle>
            <CardDescription>
              Used to calculate hourly targets. Start with conservative numbers.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="bodyweight">Bodyweight (kg)</Label>
              <Input
                id="bodyweight"
                type="number"
                min={40}
                max={150}
                value={athlete.bodyweightKg}
                onChange={(e) =>
                  update({ bodyweightKg: Number(e.target.value) })
                }
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="maxCarbs">Gut tolerance ceiling (g/hr)</Label>
              <Input
                id="maxCarbs"
                type="number"
                min={30}
                max={120}
                step={5}
                value={athlete.maxCarbsPerHour}
                onChange={(e) =>
                  update({ maxCarbsPerHour: Number(e.target.value) })
                }
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-stone-500">
                Max carbs your gut can absorb — 60g single-source, 90g with glucose+fructose
              </p>
            </div>
            <div>
              <Label htmlFor="fluid">Fluid target (ml/hr)</Label>
              <Input
                id="fluid"
                type="number"
                min={200}
                max={1500}
                step={50}
                value={athlete.fluidTargetPerHourMl}
                onChange={(e) =>
                  update({ fluidTargetPerHourMl: Number(e.target.value) })
                }
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-stone-500">
                500–800ml is typical; more in heat
              </p>
            </div>
            <div>
              <Label htmlFor="sodium">Sodium target (mg/hr)</Label>
              <Input
                id="sodium"
                type="number"
                min={100}
                max={2000}
                step={50}
                value={athlete.sodiumTargetPerHourMg}
                onChange={(e) =>
                  update({ sodiumTargetPerHourMg: Number(e.target.value) })
                }
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-stone-500">
                500–1000mg typical
              </p>
            </div>
            <div>
              <Label>Caffeine preference</Label>
              <Select
                value={athlete.caffeinePreference}
                onValueChange={(v) =>
                  update({
                    caffeinePreference: v as AthleteProfile["caffeinePreference"],
                  })
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="limited">Limited (strategic only)</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {athlete.caffeinePreference !== "none" && (
              <div>
                <Label htmlFor="caffeineMax">Max caffeine total (mg)</Label>
                <Input
                  id="caffeineMax"
                  type="number"
                  min={0}
                  max={1000}
                  step={25}
                  value={athlete.caffeineMaxMg ?? 200}
                  onChange={(e) =>
                    update({ caffeineMaxMg: Number(e.target.value) })
                  }
                  className="mt-1.5"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferences & Exclusions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <ToggleOption
              label="No solid food"
              description="Gels and fluids only throughout"
              checked={athlete.preferences.noSolids}
              onChange={(v) => updatePref("noSolids", v)}
            />
            <ToggleOption
              label="Drink-heavy strategy"
              description="Prioritise drink mix over gels"
              checked={athlete.preferences.drinkHeavy}
              onChange={(v) => updatePref("drinkHeavy", v)}
            />
            <ToggleOption
              label="Gel-light strategy"
              description="Minimise gel use, favour other formats"
              checked={athlete.preferences.gelLight}
              onChange={(v) => updatePref("gelLight", v)}
            />
            <div>
              <Label htmlFor="noSweetAfter">
                Avoid sweet foods after hour
              </Label>
              <Input
                id="noSweetAfter"
                type="number"
                min={1}
                max={30}
                value={athlete.preferences.noSweetAfterHour ?? ""}
                onChange={(e) =>
                  updatePref(
                    "noSweetAfterHour",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="e.g. 7"
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-stone-500">
                Planner avoids high-sweetness items after this point
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Energy Model Inputs — collapsible */}
        <Card>
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setShowEnergyModel((v) => !v)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-500" />
                  Calorie &amp; Carb Calculator
                  <span className="text-xs font-normal text-amber-600 bg-amber-900/30 px-2 py-0.5 rounded-full">Recommended</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Uses Minetti (2002) energy cost formula + intensity to calculate your calorie burn rate
                  and derive optimal fuelling intervals. Every 300 kcal burned → 25 g carbs.
                </CardDescription>
              </div>
              {showEnergyModel ? (
                <ChevronUp className="h-4 w-4 text-stone-500 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-stone-500 flex-shrink-0" />
              )}
            </div>
          </CardHeader>

          {showEnergyModel && (
            <CardContent className="space-y-5">
              {/* Race intensity */}
              <div>
                <Label>Race effort level <span className="text-amber-500">*</span></Label>
                <p className="mt-0.5 mb-2 text-xs text-stone-500">
                  Determines your % VO₂max, which sets the carbohydrate oxidation fraction and fuelling frequency.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["easy", "moderate", "hard", "race"] as RaceIntensity[]).map((level) => {
                    const selected = athlete.trainingMetrics?.raceIntensity === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => updateMetrics({ raceIntensity: level })}
                        className={`flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors ${
                          selected
                            ? "border-amber-700/60 bg-amber-900/20"
                            : "border-stone-700 bg-stone-900/20 hover:border-stone-600"
                        }`}
                      >
                        <span className="text-sm font-medium text-stone-200">
                          {INTENSITY_LABELS[level]}
                        </span>
                        <span className="text-xs text-stone-500">
                          {INTENSITY_DESCRIPTIONS[level]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fat adaptation */}
              <div>
                <Label>Fat adaptation level</Label>
                <p className="mt-0.5 mb-2 text-xs text-stone-500">
                  Fat-adapted athletes oxidise more fat at any given intensity, reducing exogenous carb need.
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {([
                    { value: "low" as FatAdaptation, label: "Low", desc: "Standard carb-based diet" },
                    { value: "medium" as FatAdaptation, label: "Medium", desc: "Trained for fat burning" },
                    { value: "high" as FatAdaptation, label: "High", desc: "LCHF / keto athlete" },
                  ]).map(({ value, label, desc }) => {
                    const selected = (athlete.trainingMetrics?.fatAdaptation ?? "low") === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateMetrics({ fatAdaptation: value })}
                        className={`flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors ${
                          selected
                            ? "border-amber-700/60 bg-amber-900/20"
                            : "border-stone-700 bg-stone-900/20 hover:border-stone-600"
                        }`}
                      >
                        <span className="text-sm font-medium text-stone-200">{label}</span>
                        <span className="text-xs text-stone-500">{desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* VO2max + Sweat rate */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="vo2max">VO₂max estimate (ml/kg/min)</Label>
                  <Input
                    id="vo2max"
                    type="number"
                    min={25}
                    max={90}
                    value={athlete.trainingMetrics?.vo2MaxEstimate ?? ""}
                    onChange={(e) =>
                      updateMetrics({ vo2MaxEstimate: e.target.value ? Number(e.target.value) : undefined })
                    }
                    placeholder="e.g. 55"
                    className="mt-1.5"
                  />
                  <p className="mt-1 text-xs text-stone-500">
                    From Garmin Connect, Polar, Whoop — informational, helps you pick the right effort band.
                  </p>
                </div>
                <div>
                  <Label htmlFor="sweatRate">Sweat rate (ml/hr)</Label>
                  <Input
                    id="sweatRate"
                    type="number"
                    min={200}
                    max={2000}
                    step={50}
                    value={athlete.trainingMetrics?.hydrationLossEstimateMlPerHour ?? ""}
                    onChange={(e) =>
                      updateMetrics({ hydrationLossEstimateMlPerHour: e.target.value ? Number(e.target.value) : undefined })
                    }
                    placeholder="e.g. 750"
                    className="mt-1.5"
                  />
                  <p className="mt-1 text-xs text-stone-500">
                    From Garmin / Whoop sweat data. Overrides fluid target if higher.
                  </p>
                </div>
              </div>

              {/* Live preview */}
              <EnergyModelPreview athlete={athlete} />
            </CardContent>
          )}
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg">
            Next: Upload Route
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Energy model live preview ────────────────────────────────────────────────

function EnergyModelPreview({ athlete }: { athlete: AthleteProfile }) {
  const m = athlete.trainingMetrics;
  if (!m?.raceIntensity) {
    return (
      <div className="rounded-lg border border-stone-700/50 bg-stone-900/30 p-4 text-xs text-stone-500">
        Select a race effort level above to see your estimated calorie burn rate and fuelling intervals.
      </div>
    );
  }

  const intensityFraction = INTENSITY_VO2MAX[m.raceIntensity];
  // Flat estimate at 7 min/km as a preview baseline
  const kcalFlat = caloricBurnRate(athlete.bodyweightKg, 60 / 7, 0);
  // Climb estimate at 12 min/km, 15% grade
  const kcalClimb = caloricBurnRate(athlete.bodyweightKg, 60 / 12, 0.15);
  // Descent estimate at 5 min/km, -10% grade
  const kcalDescent = caloricBurnRate(athlete.bodyweightKg, 60 / 5, -0.10);

  const intervalFlat    = fuellingIntervalMinutes(kcalFlat);
  const intervalClimb   = fuellingIntervalMinutes(kcalClimb);
  const intervalDescent = fuellingIntervalMinutes(kcalDescent);

  const carbsFlat    = Math.min(athlete.maxCarbsPerHour, derivedCarbGPerHour(kcalFlat));
  const carbsClimb   = Math.min(athlete.maxCarbsPerHour, derivedCarbGPerHour(kcalClimb));
  const carbsDescent = Math.min(athlete.maxCarbsPerHour, derivedCarbGPerHour(kcalDescent));

  return (
    <div className="rounded-lg border border-amber-800/30 bg-amber-950/20 p-4 space-y-3">
      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
        Estimated burn rates for {athlete.bodyweightKg} kg at {m.raceIntensity} effort
      </p>
      <div className="grid grid-cols-3 gap-3 text-xs">
        {[
          { label: "Flat/rolling", kcal: kcalFlat, interval: intervalFlat, carbs: carbsFlat },
          { label: "Climbing", kcal: kcalClimb, interval: intervalClimb, carbs: carbsClimb },
          { label: "Descending", kcal: kcalDescent, interval: intervalDescent, carbs: carbsDescent },
        ].map((row) => (
          <div key={row.label} className="space-y-1.5">
            <p className="font-medium text-stone-300">{row.label}</p>
            <p className="text-amber-400 font-semibold">{Math.round(row.kcal)} kcal/hr</p>
            <p className="text-stone-400">Fuel every <span className="text-stone-200 font-medium">{row.interval} min</span></p>
            <p className="text-stone-400"><span className="text-stone-200 font-medium">{row.carbs} g</span> carbs/hr</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-stone-600">
        Based on Minetti (2002) energy cost of running formula. Actual intervals calculated per-segment from your GPX route.
      </p>
    </div>
  );
}

function ToggleOption({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
        checked
          ? "border-amber-700/60 bg-amber-900/20"
          : "border-stone-700 bg-stone-900/20 hover:border-stone-600"
      }`}
    >
      <div
        className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded border ${
          checked
            ? "border-amber-600 bg-amber-700"
            : "border-stone-600 bg-stone-800"
        } flex items-center justify-center`}
      >
        {checked && (
          <svg
            className="h-2.5 w-2.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
      <div>
        <div className="text-sm font-medium text-stone-200">{label}</div>
        <div className="text-xs text-stone-500">{description}</div>
      </div>
    </button>
  );
}
