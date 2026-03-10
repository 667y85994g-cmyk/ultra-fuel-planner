"use client";

import { useState } from "react";
import { usePlanner } from "@/lib/planner-store";
import type { PriorEffort } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Activity,
  Clock,
  Mountain,
  Heart,
  Flame,
  Info,
} from "lucide-react";
import { generateId } from "@/lib/utils";
import { calibrateFromPriorEfforts } from "@/lib/calibration-engine";

interface Props {
  onBack: () => void;
  onNext: () => void;
}

const EMPTY_EFFORT: Omit<PriorEffort, "id"> = {
  label: "",
  distanceKm: 0,
  durationMinutes: 0,
  elevationGainM: 0,
  avgHeartRate: undefined,
  caloriesBurned: undefined,
  avgPaceMinPerKm: undefined,
  weather: undefined,
  fuellingNotes: undefined,
  whatWorked: undefined,
  whatDidntWork: undefined,
};

export function StepCalibration({ onBack, onNext }: Props) {
  const { state, dispatch } = usePlanner();
  const efforts = state.priorEfforts ?? [];
  const [editing, setEditing] = useState<PriorEffort | null>(null);
  const [showForm, setShowForm] = useState(false);

  const addEffort = (effort: PriorEffort) => {
    dispatch({ type: "ADD_PRIOR_EFFORT", effort });
    setEditing(null);
    setShowForm(false);
  };

  const removeEffort = (id: string) => {
    dispatch({
      type: "SET_PRIOR_EFFORTS",
      efforts: efforts.filter((e) => e.id !== id),
    });
  };

  // Quick calibration preview
  const athlete = state.athlete!;
  const calibration = efforts.length > 0
    ? calibrateFromPriorEfforts(
        efforts,
        athlete,
        state.targetFinishTimeMinutes,
        state.racePriority,
      )
    : null;

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-50">
          Prior effort data
        </h1>
        <p className="mt-2 text-stone-400">
          Add data from your past races or long training runs. The planner
          uses this to estimate your personal burn rate and set carb targets —
          more data means better accuracy.
        </p>
      </div>

      <div className="space-y-6">
        {/* Existing efforts */}
        {efforts.length > 0 && (
          <div className="space-y-3">
            {efforts.map((effort) => (
              <EffortCard
                key={effort.id}
                effort={effort}
                onRemove={() => removeEffort(effort.id)}
              />
            ))}
          </div>
        )}

        {/* Calibration preview */}
        {calibration && (
          <Card className="border-amber-800/30 bg-amber-950/10">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-400 mb-2">
                    Calibration preview
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm mb-3">
                    <div>
                      <p className="text-xs text-stone-500">Estimated burn rate</p>
                      <p className="font-semibold text-stone-100">
                        ~{calibration.estimatedKcalPerHour} kcal/hr
                      </p>
                      <p className="text-xs text-stone-600 mt-0.5">
                        range: {calibration.kcalPerHourRange[0]}–{calibration.kcalPerHourRange[1]}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Suggested carb range</p>
                      <p className="font-semibold text-stone-100">
                        {calibration.suggestedCarbRangeGPerHour[0]}–{calibration.suggestedCarbRangeGPerHour[1]} g/hr
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Working target</p>
                      <p className="font-semibold text-amber-400">
                        {calibration.workingCarbTargetGPerHour} g/hr
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Confidence</p>
                      <p className={`font-semibold ${
                        calibration.confidenceLevel === "high" ? "text-green-400"
                        : calibration.confidenceLevel === "moderate" ? "text-blue-400"
                        : "text-amber-400"
                      }`}>
                        {calibration.confidenceLevel}
                      </p>
                      <p className="text-xs text-stone-600 mt-0.5">
                        {calibration.priorEffortsUsed} effort{calibration.priorEffortsUsed !== 1 ? "s" : ""} used
                      </p>
                    </div>
                  </div>
                  {calibration.confidenceNotes.length > 0 && (
                    <div className="space-y-1">
                      {calibration.confidenceNotes.map((note, i) => (
                        <p key={i} className="text-xs text-stone-500 flex items-start gap-1.5">
                          <Info className="h-3 w-3 flex-shrink-0 mt-0.5 text-stone-600" />
                          {note}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No data hint */}
        {efforts.length === 0 && !showForm && (
          <Card className="border-stone-700/50 border-dashed">
            <CardContent className="p-8 text-center">
              <Activity className="h-8 w-8 mx-auto text-stone-600 mb-3" />
              <h3 className="text-sm font-medium text-stone-300 mb-1">
                No prior efforts added
              </h3>
              <p className="text-xs text-stone-500 mb-4 max-w-md mx-auto">
                Add data from your Garmin, Strava, Whoop or any past race/training
                effort. The more data, the more personalised your plan.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(true);
                  setEditing({
                    id: generateId(),
                    ...EMPTY_EFFORT,
                  });
                }}
              >
                <Plus className="h-4 w-4" />
                Add your first effort
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add effort form */}
        {showForm && editing && (
          <EffortForm
            effort={editing}
            onSave={addEffort}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        )}

        {/* Add more button */}
        {efforts.length > 0 && !showForm && (
          <Button
            variant="outline"
            onClick={() => {
              setShowForm(true);
              setEditing({
                id: generateId(),
                ...EMPTY_EFFORT,
              });
            }}
          >
            <Plus className="h-4 w-4" />
            Add another effort
          </Button>
        )}

        {/* Skip note */}
        {efforts.length === 0 && (
          <div className="rounded-lg border border-stone-800 bg-stone-900/30 p-4 text-xs text-stone-500 leading-relaxed">
            <span className="font-medium text-stone-400">No data? </span>
            That&apos;s fine — the planner will use your bodyweight, experience
            level and event type to estimate targets. You can always add calibration
            data later.
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <Button size="lg" onClick={onNext}>
            {efforts.length === 0 ? "Skip — continue without data" : "Next: Upload Route"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Effort card ─────────────────────────────────────────────────────────────

function EffortCard({
  effort,
  onRemove,
}: {
  effort: PriorEffort;
  onRemove: () => void;
}) {
  const durationHrs = Math.floor(effort.durationMinutes / 60);
  const durationMins = effort.durationMinutes % 60;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-stone-200 truncate">
              {effort.label || "Unnamed effort"}
            </h4>
            <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-stone-400">
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {effort.distanceKm}km
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {durationHrs}h{durationMins > 0 ? ` ${durationMins}m` : ""}
              </span>
              <span className="flex items-center gap-1">
                <Mountain className="h-3 w-3" />
                ↑{effort.elevationGainM}m
              </span>
              {effort.avgHeartRate && (
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {effort.avgHeartRate}bpm
                </span>
              )}
              {effort.caloriesBurned && (
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  {effort.caloriesBurned}kcal
                </span>
              )}
              {effort.weather && (
                <span className="text-stone-500">{effort.weather}</span>
              )}
            </div>
            {(effort.whatWorked || effort.whatDidntWork) && (
              <div className="mt-2 space-y-1 text-xs">
                {effort.whatWorked && (
                  <p className="text-green-500/80">
                    ✓ {effort.whatWorked}
                  </p>
                )}
                {effort.whatDidntWork && (
                  <p className="text-red-400/80">
                    ✗ {effort.whatDidntWork}
                  </p>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-stone-500 hover:text-red-400 flex-shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Effort entry form ───────────────────────────────────────────────────────

function EffortForm({
  effort,
  onSave,
  onCancel,
}: {
  effort: PriorEffort;
  onSave: (effort: PriorEffort) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(effort);
  const [durationHrs, setDurationHrs] = useState(Math.floor(effort.durationMinutes / 60));
  const [durationMins, setDurationMins] = useState(effort.durationMinutes % 60);

  const set = <K extends keyof PriorEffort>(key: K, val: PriorEffort[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleSave = () => {
    if (!form.label || form.distanceKm <= 0 || (durationHrs === 0 && durationMins === 0)) return;
    onSave({
      ...form,
      durationMinutes: durationHrs * 60 + durationMins,
    });
  };

  const isValid = form.label.trim() !== "" && form.distanceKm > 0 && (durationHrs > 0 || durationMins > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add prior effort</CardTitle>
        <CardDescription>
          Enter data from a past race or long run. Check your Garmin, Strava, or Whoop
          for exact values.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Required fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="effortLabel">
              Effort name <span className="text-amber-500">*</span>
            </Label>
            <Input
              id="effortLabel"
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
              placeholder="e.g. CCC 2024, Long training run 35k"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="effortDistance">
              Distance (km) <span className="text-amber-500">*</span>
            </Label>
            <Input
              id="effortDistance"
              type="number"
              min={1}
              step={0.1}
              value={form.distanceKm || ""}
              onChange={(e) => set("distanceKm", Number(e.target.value))}
              placeholder="e.g. 100"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>
              Duration <span className="text-amber-500">*</span>
            </Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                type="number"
                min={0}
                max={60}
                value={durationHrs || ""}
                onChange={(e) => setDurationHrs(Number(e.target.value))}
                placeholder="Hrs"
                className="flex-1"
              />
              <Input
                type="number"
                min={0}
                max={59}
                value={durationMins || ""}
                onChange={(e) => setDurationMins(Number(e.target.value))}
                placeholder="Mins"
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="effortElevation">
              Elevation gain (m) <span className="text-amber-500">*</span>
            </Label>
            <Input
              id="effortElevation"
              type="number"
              min={0}
              value={form.elevationGainM || ""}
              onChange={(e) => set("elevationGainM", Number(e.target.value))}
              placeholder="e.g. 6100"
              className="mt-1.5"
            />
          </div>
        </div>

        {/* Optional — device data */}
        <div>
          <p className="text-xs text-stone-500 mb-3 font-medium uppercase tracking-wide">
            Device data (optional — improves accuracy)
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="effortHR">Avg heart rate (bpm)</Label>
              <Input
                id="effortHR"
                type="number"
                min={60}
                max={220}
                value={form.avgHeartRate ?? ""}
                onChange={(e) =>
                  set("avgHeartRate", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="e.g. 145"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="effortCalories">Calories burned (kcal)</Label>
              <Input
                id="effortCalories"
                type="number"
                min={0}
                value={form.caloriesBurned ?? ""}
                onChange={(e) =>
                  set("caloriesBurned", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="e.g. 4500"
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-stone-500">
                From your watch — most accurate calibration source
              </p>
            </div>
            <div>
              <Label htmlFor="effortPace">Avg pace (min/km)</Label>
              <Input
                id="effortPace"
                type="number"
                min={3}
                max={30}
                step={0.1}
                value={form.avgPaceMinPerKm ?? ""}
                onChange={(e) =>
                  set("avgPaceMinPerKm", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="e.g. 8.5"
                className="mt-1.5"
              />
            </div>
          </div>
        </div>

        {/* Optional — race notes */}
        <div>
          <p className="text-xs text-stone-500 mb-3 font-medium uppercase tracking-wide">
            Notes (optional)
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="effortWeather">Weather conditions</Label>
              <Input
                id="effortWeather"
                value={form.weather ?? ""}
                onChange={(e) => set("weather", e.target.value || undefined)}
                placeholder="e.g. hot, cool, rain"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="effortFuelling">What you ate/drank</Label>
              <Input
                id="effortFuelling"
                value={form.fuellingNotes ?? ""}
                onChange={(e) => set("fuellingNotes", e.target.value || undefined)}
                placeholder="e.g. gels every 30min, 600ml/hr"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="effortWorked">What worked well</Label>
              <Input
                id="effortWorked"
                value={form.whatWorked ?? ""}
                onChange={(e) => set("whatWorked", e.target.value || undefined)}
                placeholder="e.g. drink mix on climbs"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="effortFailed">What didn&apos;t work</Label>
              <Input
                id="effortFailed"
                value={form.whatDidntWork ?? ""}
                onChange={(e) => set("whatDidntWork", e.target.value || undefined)}
                placeholder="e.g. bars caused nausea after 5h"
                className="mt-1.5"
              />
            </div>
          </div>
        </div>

        {/* Form actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            <Plus className="h-4 w-4" />
            Add effort
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
