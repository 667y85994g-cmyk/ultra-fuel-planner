"use client";

import type { PlannerOutput, SegmentRecommendation } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { terrainBgClass, terrainColor, formatDuration, fuelTypeLabel, fuelTypeIcon } from "@/lib/utils";
import { TrendingUp, Clock, Route, ThumbsDown } from "lucide-react";

interface Props {
  output: PlannerOutput;
}

export function SegmentView({ output }: Props) {
  const { segmentRecommendations, eventPlan } = output;
  const segments = eventPlan.route?.segments ?? [];

  if (segments.length === 0 || segmentRecommendations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="text-4xl">🗺️</div>
        <p className="text-stone-400">
          No route data. Upload a GPX file for terrain-aware recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-stone-50">Segment Recommendations</h2>
        <p className="mt-1 text-sm text-stone-400">
          Terrain-aware fuelling strategy for each section of your route.
        </p>
      </div>

      {segments.map((seg) => {
        const rec = segmentRecommendations.find(
          (r) => r.segmentId === seg.id
        );
        if (!rec) return null;

        return (
          <Card key={seg.id}>
            <CardContent className="p-0 overflow-hidden">
              {/* Terrain color bar */}
              <div
                className="h-1 w-full"
                style={{ backgroundColor: terrainColor(seg.terrain) }}
              />

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={terrainBgClass(seg.terrain)}>
                        {rec.terrainLabel}
                      </Badge>
                      <span className="text-xs text-stone-500">
                        km {seg.startKm.toFixed(1)}–{seg.endKm.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 text-xs text-stone-500">
                    <div className="flex items-center gap-1">
                      <Route className="h-3.5 w-3.5" />
                      {seg.distanceKm.toFixed(1)}km
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      ↑{seg.ascentM}m ↓{seg.descentM}m
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      ~{formatDuration(seg.estimatedDurationMinutes)}
                    </div>
                  </div>
                </div>

                {/* Rationale */}
                <p className="mt-3 text-sm text-stone-400 leading-relaxed">
                  {rec.rationale}
                </p>

                {rec.timingNote && (
                  <p className="mt-2 text-xs text-amber-400 italic">
                    💡 {rec.timingNote}
                  </p>
                )}

                {/* Fuel recommendations */}
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {/* Preferred */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                      Prefer
                    </p>
                    {rec.primaryFuelType === "fluid_only" ? (
                      <div className="flex items-center gap-2 rounded-md bg-stone-800/60 px-3 py-2 text-sm text-stone-300">
                        🫙 Fluids only — no solids here
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {[rec.primaryFuelType, ...eventPlan.fuelInventory
                          .filter(fi => fi.type === rec.primaryFuelType)
                          .map(fi => fi.type)
                          .filter((v, i, a) => a.indexOf(v) === i)
                        ].slice(0, 3).map((type) => (
                          <span
                            key={type}
                            className="flex items-center gap-1.5 rounded-md border border-green-700/30 bg-green-900/20 px-2.5 py-1.5 text-xs text-green-300"
                          >
                            {fuelTypeIcon(type)} {fuelTypeLabel(type)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Avoid */}
                  {rec.avoid.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                        Avoid
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from(new Set(rec.avoid)).map((type) => (
                          <span
                            key={type}
                            className="flex items-center gap-1.5 rounded-md border border-red-800/30 bg-red-900/15 px-2.5 py-1.5 text-xs text-red-400"
                          >
                            <ThumbsDown className="h-3 w-3" />
                            {fuelTypeLabel(type)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Effort bar */}
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs text-stone-600">Effort</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className={`h-1.5 w-4 rounded-sm ${
                          n <= seg.effortLevel
                            ? seg.effortLevel >= 4
                              ? "bg-red-600"
                              : seg.effortLevel >= 3
                              ? "bg-amber-600"
                              : "bg-green-600"
                            : "bg-stone-800"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-stone-600">
                    {seg.effortLevel}/5
                  </span>
                  <span className="ml-auto text-xs text-stone-600">
                    {seg.avgGradientPct > 0 ? "+" : ""}{seg.avgGradientPct}% avg gradient
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
