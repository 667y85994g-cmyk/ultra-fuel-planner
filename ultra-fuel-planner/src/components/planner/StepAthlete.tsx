"use client";

import { useState } from "react";
import { usePlanner } from "@/lib/planner-store";
import {
  GUIDED_EXPERIENCE_OPTIONS,
  FUELLING_LEVEL_OPTIONS,
  CONDITIONS_OPTIONS,
  DEFAULT_GUIDED_PROFILE,
} from "@/lib/guided-profile";
import type { AthleteProfile, EventType, RacePriority, GuidedProfile } from "@/types";
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
import { ChevronRight, Settings2 } from "lucide-react";

interface Props {
  onNext: () => void;
}

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "trail_marathon", label: "Trail Marathon" },
  { value: "ultra_50k",      label: "Ultra 50K" },
  { value: "ultra_50m",      label: "Ultra 50 Miles" },
  { value: "ultra_100k",     label: "Ultra 100K" },
  { value: "ultra_100m",     label: "Ultra 100 Miles" },
  { value: "mountain_ultra", label: "Mountain Ultra" },
  { value: "other",          label: "Other" },
];

const RACE_PRIORITY_OPTIONS: { value: RacePriority; label: string; desc: string }[] = [
  { value: "a_race",     label: "A-Race",       desc: "Full race effort — this is a goal event" },
  { value: "completion", label: "Completion",   desc: "Finishing is the goal — conservative pacing" },
  { value: "training",   label: "Training run", desc: "Using this as a training effort, not racing" },
];

export function StepAthlete({ onNext }: Props) {
  const { state, dispatch } = usePlanner();
  const athlete = state.athlete!;
  const profile: GuidedProfile = state.guidedProfile ?? DEFAULT_GUIDED_PROFILE;

  const [eventType, setEventType]     = useState<EventType | undefined>(state.eventType);
  const [racePriority, setRacePriority] = useState<RacePriority | undefined>(state.racePriority);
  // Temperature is only needed in advanced mode (guided mode derives it from conditions)
  const [temperature, setTemperature] = useState<number | "">(state.expectedTemperatureC ?? "");

  const updateAthlete = (patch: Partial<AthleteProfile>) => {
    dispatch({ type: "SET_ATHLETE", athlete: { ...athlete, ...patch } });
  };

  const updatePref = (key: string, value: unknown) => {
    updateAthlete({ preferences: { ...athlete.preferences, [key]: value } });
  };

  const updateProfile = (patch: Partial<GuidedProfile>) => {
    dispatch({ type: "SET_GUIDED_PROFILE", profile: { ...profile, ...patch } });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    dispatch({
      type: "SET_EVENT_META",
      eventName:             fd.get("eventName") as string,
      eventType:             eventType,
      racePriority:          racePriority,
      raceStartTime:         (fd.get("raceStartTime") as string) || undefined,
      // In advanced mode the temperature field is in the form; in guided mode
      // it's derived from the conditions selector in runPlanner().
      expectedTemperatureC:  profile.useAdvancedInputs && temperature !== ""
                               ? (temperature as number)
                               : undefined,
      targetDistanceKm:      fd.get("targetDistanceKm")
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
        <h1 className="text-2xl font-bold text-stone-50">Your event</h1>
        <p className="mt-2 text-stone-400">
          Tell us about your race and yourself — the planner handles the rest.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Event Details ──────────────────────────────────────────── */}
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
                placeholder="e.g. UTMB, Lakeland 50, Race to the Stones"
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
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
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
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
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
                If unsure, leave blank — uses GPX distance
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
              <p className="mt-1 text-xs text-stone-500">
                If unsure, leave blank — estimated from your prior runs
              </p>
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

        {/* ── About You ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About You</CardTitle>
            <CardDescription>
              Three questions — your answers shape the fuelling plan.
              Experienced runners can enter exact targets using Advanced settings below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Bodyweight — always shown, needed by the energy model */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="bodyweight">Your weight (kg)</Label>
                <Input
                  id="bodyweight"
                  type="number"
                  min={40}
                  max={150}
                  value={athlete.bodyweightKg}
                  onChange={(e) => updateAthlete({ bodyweightKg: Number(e.target.value) })}
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-stone-500">Used to estimate energy expenditure</p>
              </div>
            </div>

            {/* Experience */}
            <div>
              <p className="mb-2 text-sm font-medium text-stone-200">
                Ultra running experience
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {GUIDED_EXPERIENCE_OPTIONS.map(({ value, label, description }) => {
                  const selected = profile.guidedExperience === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateProfile({ guidedExperience: value })}
                      className={`flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors ${
                        selected
                          ? "border-amber-700/60 bg-amber-900/20"
                          : "border-stone-700 bg-stone-900/20 hover:border-stone-600"
                      }`}
                    >
                      <span className="text-sm font-medium text-stone-200">{label}</span>
                      <span className="text-xs text-stone-500">{description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fuelling level */}
            <div>
              <p className="mb-1 text-sm font-medium text-stone-200">
                How much do you typically fuel?
              </p>
              <p className="mb-2 text-xs text-stone-500">
                If unsure, choose &ldquo;Not sure&rdquo; — the planner will estimate
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {FUELLING_LEVEL_OPTIONS.map(({ value, label, description }) => {
                  const selected = profile.fuellingLevel === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateProfile({ fuellingLevel: value })}
                      className={`flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors ${
                        selected
                          ? "border-amber-700/60 bg-amber-900/20"
                          : "border-stone-700 bg-stone-900/20 hover:border-stone-600"
                      }`}
                    >
                      <span className="text-sm font-medium text-stone-200">{label}</span>
                      <span className="text-xs text-stone-500">{description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expected conditions */}
            <div>
              <p className="mb-1 text-sm font-medium text-stone-200">
                Expected conditions
              </p>
              <p className="mb-2 text-xs text-stone-500">
                Affects hydration guidance and fluid targets
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {CONDITIONS_OPTIONS.map(({ value, label, description }) => {
                  const selected = profile.expectedConditions === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateProfile({ expectedConditions: value })}
                      className={`flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors ${
                        selected
                          ? "border-amber-700/60 bg-amber-900/20"
                          : "border-stone-700 bg-stone-900/20 hover:border-stone-600"
                      }`}
                    >
                      <span className="text-sm font-medium text-stone-200">{label}</span>
                      <span className="text-xs text-stone-500">{description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </CardContent>
        </Card>

        {/* ── Advanced Settings ──────────────────────────────────────── */}
        <div>
          <button
            type="button"
            onClick={() => updateProfile({ useAdvancedInputs: !profile.useAdvancedInputs })}
            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
              profile.useAdvancedInputs
                ? "border-amber-700/60 bg-amber-900/15"
                : "border-stone-700 bg-stone-900/20 hover:border-stone-600"
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings2 className={`h-4 w-4 flex-shrink-0 ${profile.useAdvancedInputs ? "text-amber-500" : "text-stone-500"}`} />
              <div>
                <p className="text-sm font-medium text-stone-200">
                  Use my own fuelling targets
                </p>
                <p className="text-xs text-stone-500">
                  {profile.useAdvancedInputs
                    ? "Entering your own numbers — guided estimates are overridden"
                    : "Enable to enter exact carb, fluid and sodium targets"}
                </p>
              </div>
            </div>
            <div
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
                profile.useAdvancedInputs
                  ? "border-amber-600 bg-amber-700"
                  : "border-stone-600 bg-stone-800"
              }`}
            >
              {profile.useAdvancedInputs && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>

          {profile.useAdvancedInputs && (
            <Card className="mt-3 border-amber-800/30">
              <CardContent className="grid gap-4 pt-5 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label htmlFor="carbTarget">Carb target (g/hr)</Label>
                  <Input
                    id="carbTarget"
                    type="number"
                    min={20}
                    max={120}
                    step={5}
                    value={athlete.carbTargetPerHour}
                    onChange={(e) => updateAthlete({ carbTargetPerHour: Number(e.target.value) })}
                    className="mt-1.5"
                  />
                  <p className="mt-1 text-xs text-stone-500">
                    Your starting carb target — refined by calibration data
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
                    onChange={(e) => updateAthlete({ maxCarbsPerHour: Number(e.target.value) })}
                    className="mt-1.5"
                  />
                  <p className="mt-1 text-xs text-stone-500">
                    60g single-source, 90g+ with glucose + fructose
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
                    onChange={(e) => updateAthlete({ fluidTargetPerHourMl: Number(e.target.value) })}
                    className="mt-1.5"
                  />
                  <p className="mt-1 text-xs text-stone-500">
                    Plan will show a practical range around this baseline
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
                    onChange={(e) => updateAthlete({ sodiumTargetPerHourMg: Number(e.target.value) })}
                    className="mt-1.5"
                  />
                  <p className="mt-1 text-xs text-stone-500">
                    Guides electrolyte tier recommendation
                  </p>
                </div>
                <div>
                  <Label>Caffeine strategy</Label>
                  <Select
                    value={athlete.caffeinePreference}
                    onValueChange={(v) =>
                      updateAthlete({ caffeinePreference: v as AthleteProfile["caffeinePreference"] })
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="limited">Limited — strategic only</SelectItem>
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
                      onChange={(e) => updateAthlete({ caffeineMaxMg: Number(e.target.value) })}
                      className="mt-1.5"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="temperature">Expected temperature (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min={-10}
                    max={50}
                    value={temperature}
                    onChange={(e) =>
                      setTemperature(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="e.g. 18"
                    className="mt-1.5"
                  />
                  <p className="mt-1 text-xs text-stone-500">
                    Overrides the conditions selector above
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Preferences ────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferences & Exclusions</CardTitle>
            <CardDescription>
              Shapes which products the planner recommends and when.
            </CardDescription>
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
              description="Prefers savoury or mild flavours"
              checked={athlete.preferences.lowSweetnessTolerance}
              onChange={(v) => updatePref("lowSweetnessTolerance", v)}
            />
            <div>
              <Label htmlFor="noSweetAfter">Avoid sweet foods after hour</Label>
              <Input
                id="noSweetAfter"
                type="number"
                min={1}
                max={30}
                value={athlete.preferences.noSweetAfterHour ?? ""}
                onChange={(e) =>
                  updatePref(
                    "noSweetAfterHour",
                    e.target.value ? Number(e.target.value) : undefined,
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
            Next: Prior Efforts
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Shared toggle component ──────────────────────────────────────────────────

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
          checked ? "border-amber-600 bg-amber-700" : "border-stone-600 bg-stone-800"
        } flex items-center justify-center`}
      >
        {checked && (
          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
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
