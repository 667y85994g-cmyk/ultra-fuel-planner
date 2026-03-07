"use client";

import { useState } from "react";
import { usePlanner } from "@/lib/planner-store";
import type { AthleteProfile, ExperienceLevel, EventType, RacePriority } from "@/types";
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
import { ChevronRight, Thermometer } from "lucide-react";

interface Props {
  onNext: () => void;
}

// ─── Experience level metadata ───────────────────────────────────────────────

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string; desc: string }[] = [
  { value: "novice", label: "Novice", desc: "First or second ultra — still learning what works" },
  { value: "intermediate", label: "Intermediate", desc: "A few ultras finished — developing a system" },
  { value: "experienced", label: "Experienced", desc: "Many events — knows what works and what doesn't" },
  { value: "elite", label: "Elite / High volume", desc: "High weekly hours, dialled-in fuelling" },
];

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "trail_marathon", label: "Trail Marathon" },
  { value: "ultra_50k", label: "Ultra 50K" },
  { value: "ultra_50m", label: "Ultra 50 Miles" },
  { value: "ultra_100k", label: "Ultra 100K" },
  { value: "ultra_100m", label: "Ultra 100 Miles" },
  { value: "mountain_ultra", label: "Mountain Ultra" },
  { value: "other", label: "Other" },
];

const RACE_PRIORITY_OPTIONS: { value: RacePriority; label: string; desc: string }[] = [
  { value: "a_race", label: "A-Race", desc: "Full race effort — this is a goal event" },
  { value: "completion", label: "Completion", desc: "Finishing is the goal — conservative pacing" },
  { value: "training", label: "Training run", desc: "Using this as a training effort, not racing" },
];

export function StepAthlete({ onNext }: Props) {
  const { state, dispatch } = usePlanner();
  const athlete = state.athlete!;
  const [eventType, setEventType] = useState<EventType | undefined>(state.eventType);
  const [racePriority, setRacePriority] = useState<RacePriority | undefined>(state.racePriority);
  const [temperature, setTemperature] = useState<number | "">(state.expectedTemperatureC ?? "");

  const update = (patch: Partial<AthleteProfile>) => {
    dispatch({ type: "SET_ATHLETE", athlete: { ...athlete, ...patch } });
  };

  const updatePref = (key: string, value: unknown) => {
    update({
      preferences: { ...athlete.preferences, [key]: value },
    });
  };

  const updateEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    dispatch({
      type: "SET_EVENT_META",
      eventName: fd.get("eventName") as string,
      eventType: eventType,
      racePriority: racePriority,
      raceStartTime: (fd.get("raceStartTime") as string) || undefined,
      expectedTemperatureC: temperature !== "" ? temperature : undefined,
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
          Your event and athlete profile
        </h1>
        <p className="mt-2 text-stone-400">
          These inputs set your hourly targets. Start with conservative numbers —
          you can adjust them after seeing the plan.
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
              <Label>Event type</Label>
              <Select
                value={eventType}
                onValueChange={(v) => setEventType(v as EventType)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Race priority</Label>
              <Select
                value={racePriority}
                onValueChange={(v) => setRacePriority(v as RacePriority)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select priority..." />
                </SelectTrigger>
                <SelectContent>
                  {RACE_PRIORITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {racePriority && (
                <p className="mt-1 text-xs text-stone-500">
                  {RACE_PRIORITY_OPTIONS.find((o) => o.value === racePriority)?.desc}
                </p>
              )}
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
            <div>
              <Label htmlFor="temperature">Expected temperature (°C)</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-stone-500 flex-shrink-0" />
                <Input
                  id="temperature"
                  type="number"
                  min={-10}
                  max={50}
                  value={temperature}
                  onChange={(e) =>
                    setTemperature(e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder="e.g. 25"
                />
              </div>
              <p className="mt-1 text-xs text-stone-500">
                Fluid targets increase above 25°C
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Experience level */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Experience Level</CardTitle>
            <CardDescription>
              Helps calibrate burn rate estimates and carb target ranges when limited
              race data is available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {EXPERIENCE_OPTIONS.map(({ value, label, desc }) => {
                const selected = athlete.experienceLevel === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update({ experienceLevel: value })}
                    className={`flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors ${
                      selected
                        ? "border-amber-700/60 bg-amber-900/20"
                        : "border-stone-700 bg-stone-900/20 hover:border-stone-600"
                    }`}
                  >
                    <span className="text-sm font-medium text-stone-200">
                      {label}
                    </span>
                    <span className="text-xs text-stone-500">{desc}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Athlete physiology */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Athlete Inputs</CardTitle>
            <CardDescription>
              Your baseline targets. The planner may adjust these based on your
              calibration data and route terrain.
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
              <Label htmlFor="carbTarget">Carb target (g/hr)</Label>
              <Input
                id="carbTarget"
                type="number"
                min={20}
                max={120}
                step={5}
                value={athlete.carbTargetPerHour}
                onChange={(e) =>
                  update({ carbTargetPerHour: Number(e.target.value) })
                }
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-stone-500">
                Your starting carb target — may be adjusted by calibration data
              </p>
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
                Max your gut can absorb — 60g single-source, 90g+ with glucose+fructose
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
            <ToggleOption
              label="Low sweetness tolerance"
              description="Prefers savoury or mild flavours — avoids very sweet items"
              checked={athlete.preferences.lowSweetnessTolerance}
              onChange={(v) => updatePref("lowSweetnessTolerance", v)}
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
