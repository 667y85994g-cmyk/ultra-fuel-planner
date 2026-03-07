"use client";

import { useState, useCallback, useRef } from "react";
import { usePlanner } from "@/lib/planner-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  Mountain,
  TrendingUp,
  TrendingDown,
  Route,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import type { ParsedRoute } from "@/types";
import { ElevationChart } from "./ElevationChart";
import { terrainBgClass } from "@/lib/utils";
import { terrainLabel } from "@/lib/segmentation";

interface Props {
  onBack: () => void;
  onNext: () => void;
}

export function StepRoute({ onBack, onNext }: Props) {
  const { state, dispatch } = usePlanner();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const route = state.parsedRoute;

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".gpx")) {
        setError("Please upload a .gpx file.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("gpx", file);

        const res = await fetch("/api/parse-gpx", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Failed to parse GPX.");
          return;
        }

        dispatch({ type: "SET_ROUTE", route: data.route as ParsedRoute });
      } catch {
        setError("Network error — could not parse GPX.");
      } finally {
        setIsLoading(false);
        // Reset so the same file can be re-uploaded if needed
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [dispatch]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleReplace = () => {
    dispatch({ type: "CLEAR_ROUTE" });
    setError(null);
    // Trigger file picker
    setTimeout(() => inputRef.current?.click(), 50);
  };

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-50">Upload your GPX route</h1>
        <p className="mt-2 text-stone-400">
          The planner uses elevation and gradient to classify terrain and adapt
          your fuelling recommendations.
        </p>
      </div>

      <div className="space-y-6">
        {/* Drop zone — only shown when no route loaded */}
        {!route && (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`relative flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
                isDragging
                  ? "border-amber-600 bg-amber-900/10"
                  : "border-stone-700 bg-stone-900/30 hover:border-stone-600 hover:bg-stone-900/50"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".gpx"
                onChange={onInputChange}
                className="absolute inset-0 cursor-pointer opacity-0"
                disabled={isLoading}
              />
              {isLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-600 border-t-amber-500" />
                  <p className="text-sm text-stone-400">Parsing route...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center px-6">
                  <div className="rounded-full bg-stone-800 p-3">
                    <Upload className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-200">
                      Drop your GPX file here
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      or click to browse — exported from Komoot, Strava, Garmin
                    </p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-800/40 bg-red-900/20 p-4 text-sm text-red-300">
                {error}
              </div>
            )}
          </>
        )}

        {/* Route loaded — show banner + replace button */}
        {route && (
          <div className="space-y-4 animate-slide-up">
            {/* Loaded banner */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-green-800/40 bg-green-900/15 px-4 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-300">
                    {route.fileName ?? "Route loaded"}
                  </p>
                  <p className="text-xs text-stone-500">
                    {route.totalDistanceKm.toFixed(1)} km · ↑
                    {Math.round(route.totalAscentM).toLocaleString()}m ascent
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReplace}
                className="flex-shrink-0 gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Replace
              </Button>

              {/* Hidden file input for Replace action */}
              <input
                ref={inputRef}
                type="file"
                accept=".gpx"
                onChange={onInputChange}
                className="hidden"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-800/40 bg-red-900/20 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  icon: Route,
                  label: "Distance",
                  value: `${route.totalDistanceKm.toFixed(1)} km`,
                },
                {
                  icon: TrendingUp,
                  label: "Ascent",
                  value: `${Math.round(route.totalAscentM).toLocaleString()}m`,
                },
                {
                  icon: TrendingDown,
                  label: "Descent",
                  value: `${Math.round(route.totalDescentM).toLocaleString()}m`,
                },
                {
                  icon: Mountain,
                  label: "Max elevation",
                  value: `${Math.round(route.maxElevationM)}m`,
                },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <stat.icon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-stone-500">{stat.label}</p>
                      <p className="font-semibold text-stone-100">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Elevation chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-stone-300">
                  Elevation Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ElevationChart
                  data={route.elevationProfile}
                  segments={route.segments}
                />
              </CardContent>
            </Card>

            {/* Terrain breakdown */}
            {route.segments.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-stone-300">
                    Terrain Segments ({route.segments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {route.segments.map((seg) => (
                      <div
                        key={seg.id}
                        className="flex items-center justify-between gap-3 rounded-lg bg-stone-900/60 px-4 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Badge className={terrainBgClass(seg.terrain)}>
                            {terrainLabel(seg.terrain)}
                          </Badge>
                          <div className="min-w-0">
                            <p className="text-xs text-stone-400 truncate">
                              km {seg.startKm.toFixed(1)}–{seg.endKm.toFixed(1)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0 text-xs text-stone-500">
                          <span>{seg.distanceKm.toFixed(1)}km</span>
                          <span>↑{seg.ascentM}m</span>
                          <span>~{seg.estimatedDurationMinutes}min</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Nav */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <Button size="lg" onClick={onNext} disabled={!route}>
            {route ? "Next: Add Fuel" : "Upload a GPX to continue"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Skip option */}
        {!route && (
          <div className="text-center">
            <button
              type="button"
              onClick={onNext}
              className="text-xs text-stone-500 underline underline-offset-2 hover:text-stone-400"
            >
              Skip for now — generate a time-based plan without route data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
