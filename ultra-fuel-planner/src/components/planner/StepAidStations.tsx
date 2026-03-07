"use client";

import { useState } from "react";
import { usePlanner } from "@/lib/planner-store";
import type { AidStation } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, Plus, Trash2, MapPin, Check } from "lucide-react";
import { generateId } from "@/lib/utils";

interface Props {
  onBack: () => void;
  onNext: () => void;
}

const EMPTY_STATION = (): Partial<AidStation> => ({
  name: "",
  distanceKm: 0,
  fullRefillPossible: true,
  available: {
    water: true,
    sportsDrink: false,
    gels: false,
    realFood: false,
    customItems: [],
  },
  notes: "",
});

export function StepAidStations({ onBack, onNext }: Props) {
  const { state, dispatch } = usePlanner();
  const stations = state.aidStations ?? [];
  const [draft, setDraft] = useState<Partial<AidStation>>(EMPTY_STATION());
  const [adding, setAdding] = useState(false);

  // Sort stations by distance
  const sorted = [...stations].sort((a, b) => a.distanceKm - b.distanceKm);

  const startAdd = () => {
    setDraft(EMPTY_STATION());
    setAdding(true);
  };

  const save = () => {
    if (!draft.name) return;
    const station: AidStation = {
      id: generateId(),
      name: draft.name!,
      distanceKm: Number(draft.distanceKm ?? 0),
      fullRefillPossible: Boolean(draft.fullRefillPossible),
      available: draft.available ?? {
        water: true,
        sportsDrink: false,
        gels: false,
        realFood: false,
        customItems: [],
      },
      notes: draft.notes,
    };
    dispatch({ type: "ADD_AID_STATION", station });
    setAdding(false);
    setDraft(EMPTY_STATION());
  };

  const remove = (id: string) => dispatch({ type: "REMOVE_AID_STATION", id });

  const routeKm = state.parsedRoute?.totalDistanceKm;

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-50">Aid stations</h1>
        <p className="mt-2 text-stone-400">
          Mark where you can refill and restock. The planner calculates what
          you need to carry between each one.
        </p>
      </div>

      <div className="space-y-4">
        {/* Station list */}
        {sorted.length === 0 && !adding && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <MapPin className="h-8 w-8 text-stone-600" />
              <div>
                <p className="font-medium text-stone-200">No aid stations added</p>
                <p className="mt-1 text-sm text-stone-500">
                  Optional, but strongly recommended for accurate carry plans.
                  Skip if it&apos;s a self-supported effort.
                </p>
              </div>
              <Button onClick={startAdd}>
                <Plus className="h-4 w-4" />
                Add aid station
              </Button>
            </CardContent>
          </Card>
        )}

        {sorted.map((station) => (
          <div
            key={station.id}
            className="flex items-center gap-4 rounded-xl border border-stone-800 bg-stone-900/40 px-5 py-4"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-900/40">
              <MapPin className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-stone-100">{station.name}</span>
                {station.fullRefillPossible && (
                  <span className="rounded-full bg-green-900/30 px-2 py-0.5 text-xs text-green-400">
                    Full refill
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-stone-500">
                <span>km {station.distanceKm.toFixed(1)}</span>
                {station.available.water && <span>Water</span>}
                {station.available.sportsDrink && <span>Sports drink</span>}
                {station.available.gels && <span>Gels</span>}
                {station.available.realFood && <span>Real food</span>}
              </div>
            </div>
            <button
              onClick={() => remove(station.id)}
              className="rounded-md p-2 text-stone-500 hover:bg-red-900/30 hover:text-red-400 transition-colors flex-shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {/* Add form */}
        {adding && (
          <Card className="border-amber-800/40">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">New aid station</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={draft.name ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
                    placeholder="e.g. Checkpoint 2 / Ambleside"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>
                    Distance km{" "}
                    {routeKm && (
                      <span className="text-stone-500 font-normal">
                        (route is {routeKm.toFixed(1)}km)
                      </span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={routeKm ?? 9999}
                    step={0.1}
                    value={draft.distanceKm ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, distanceKm: Number(e.target.value) })
                    }
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">What&apos;s available?</Label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { key: "water", label: "Water" },
                      { key: "sportsDrink", label: "Sports drink" },
                      { key: "gels", label: "Gels" },
                      { key: "realFood", label: "Real food" },
                    ] as const
                  ).map((item) => (
                    <SupplyToggle
                      key={item.key}
                      label={item.label}
                      checked={Boolean(
                        draft.available?.[item.key]
                      )}
                      onChange={(v) =>
                        setDraft({
                          ...draft,
                          available: {
                            ...draft.available!,
                            [item.key]: v,
                          },
                        })
                      }
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() =>
                      setDraft({
                        ...draft,
                        fullRefillPossible: !draft.fullRefillPossible,
                      })
                    }
                    className={`h-5 w-5 flex-shrink-0 rounded border transition-colors flex items-center justify-center cursor-pointer ${
                      draft.fullRefillPossible
                        ? "border-amber-600 bg-amber-700"
                        : "border-stone-600 bg-stone-800"
                    }`}
                  >
                    {draft.fullRefillPossible && (
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    )}
                  </div>
                  <span className="text-sm text-stone-300">
                    Full fluid refill possible here
                  </span>
                </label>
              </div>

              <div>
                <Label>Notes (optional)</Label>
                <Input
                  value={draft.notes ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, notes: e.target.value })
                  }
                  placeholder="e.g. Drop bag available, crew access"
                  className="mt-1.5"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdding(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={save}
                  disabled={!draft.name}
                >
                  <Check className="h-4 w-4" />
                  Add station
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {stations.length > 0 && !adding && (
          <button
            onClick={startAdd}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-700 py-4 text-sm text-stone-500 hover:border-stone-500 hover:text-stone-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add another aid station
          </button>
        )}

        {/* Nav */}
        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <Button size="lg" onClick={onNext}>
            Next: Review & Generate
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SupplyToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        checked
          ? "border-amber-700/50 bg-amber-900/30 text-amber-300"
          : "border-stone-700 bg-stone-800 text-stone-500 hover:border-stone-600"
      }`}
    >
      {checked ? "✓ " : ""}{label}
    </button>
  );
}
