"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import Link from "next/link";
import type { PlannerOutput } from "@/types";
import type { RoutePoint } from "@/types";
import { terrainColor } from "@/lib/utils";
import { ElevationChart } from "@/components/planner/ElevationChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UFPMark } from "@/components/brand/UFPMark";
import { MapPin } from "lucide-react";

// Leaflet is browser-only; we import dynamically inside useEffect
// to avoid SSR issues. This component itself must only be loaded via
// dynamic(() => import(...), { ssr: false }).

interface Props {
  output: PlannerOutput;
}

/** Find the lat/lon of the route point closest to a given distance (km). */
function getLatLonAtKm(points: RoutePoint[], km: number): [number, number] {
  let closest = points[0];
  let minDiff = Math.abs(points[0].distanceFromStartKm - km);
  for (const pt of points) {
    const diff = Math.abs(pt.distanceFromStartKm - km);
    if (diff < minDiff) {
      minDiff = diff;
      closest = pt;
    }
  }
  return [closest.lat, closest.lon];
}

// Semantic map colours — these represent action types, not brand surfaces.
// Fluid = slate (water-adjacent); capsule = muted purple (supplement-adjacent).
// These don't have brand token equivalents; they're intentional semantic choices.
const FUEL_MARKER_COLOR: Record<string, string> = {
  consume_gel:    "var(--ufp-ochre)",
  consume_chew:   "var(--ufp-ochre)",
  consume_bar:    "var(--ufp-ochre)",
  consume_food:   "var(--ufp-ochre)",
  drink_fluid:    "var(--ufp-slate)",    // water/info
  take_capsule:   "var(--ufp-ink-3)",   // neutral supplement
  refill_at_aid:  "var(--ufp-ochre-soft)",
  restock_carry:  "var(--ufp-ochre-soft)",
};

export function RouteMapView({ output }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);

  const route = output.eventPlan.route;
  const schedule = output.schedule;
  const aidStations = output.eventPlan.aidStations;

  useEffect(() => {
    if (!mapRef.current || !route || route.points.length === 0) return;

    // Avoid double-init
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    import("leaflet").then((L) => {
      const points = route.points;

      // Compute bounds
      const lats = points.map((p) => p.lat);
      const lons = points.map((p) => p.lon);
      const bounds = L.latLngBounds(
        [Math.min(...lats), Math.min(...lons)],
        [Math.max(...lats), Math.max(...lons)]
      );

      const map = L.map(mapRef.current!, { zoomControl: true });
      mapInstanceRef.current = map;

      // OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      map.fitBounds(bounds, { padding: [24, 24] });

      // Draw route segments colored by terrain
      for (const seg of route.segments) {
        const segPoints = points.filter(
          (p) =>
            p.distanceFromStartKm >= seg.startKm &&
            p.distanceFromStartKm <= seg.endKm
        );
        if (segPoints.length < 2) continue;
        const color = terrainColor(seg.terrain);
        L.polyline(
          segPoints.map((p) => [p.lat, p.lon] as [number, number]),
          { color, weight: 4, opacity: 0.85 }
        ).addTo(map);
      }

      // If no segments, draw the full track in amber
      if (route.segments.length === 0) {
        L.polyline(
          points.map((p) => [p.lat, p.lon] as [number, number]),
          { color: "var(--ufp-ochre)", weight: 4, opacity: 0.8 }
        ).addTo(map);
      }

      // Start marker — forest green (success / trail token)
      const startPt = points[0];
      L.circleMarker([startPt.lat, startPt.lon], {
        radius: 8,
        fillColor: "var(--ufp-forest)",
        color: "var(--ufp-forest)",
        weight: 2,
        fillOpacity: 1,
      })
        .bindTooltip("Start", { permanent: false, direction: "top" })
        .addTo(map);

      // Finish marker — clay (warning / hard section token)
      const endPt = points[points.length - 1];
      L.circleMarker([endPt.lat, endPt.lon], {
        radius: 8,
        fillColor: "var(--ufp-clay)",
        color: "var(--ufp-clay)",
        weight: 2,
        fillOpacity: 1,
      })
        .bindTooltip("Finish", { permanent: false, direction: "top" })
        .addTo(map);

      // Aid station markers
      for (const aid of aidStations) {
        const [lat, lon] = getLatLonAtKm(points, aid.distanceKm);
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:var(--ufp-ochre-soft);border:2px solid var(--ufp-ochre);border-radius:50%;width:14px;height:14px;"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        L.marker([lat, lon], { icon })
          .bindTooltip(`Aid: ${aid.name} (km ${aid.distanceKm.toFixed(1)})`, { direction: "top" })
          .addTo(map);
      }

      // Fuelling event markers (small circles)
      const fuelEntries = schedule.filter(
        (e) => e.action !== "refill_at_aid" && e.action !== "restock_carry"
      );
      for (const entry of fuelEntries) {
        const [lat, lon] = getLatLonAtKm(points, entry.distanceKm);
        const color = FUEL_MARKER_COLOR[entry.action] ?? "var(--ufp-ochre)";
        L.circleMarker([lat, lon], {
          radius: 5,
          fillColor: color,
          color: "var(--ufp-ink)",
          weight: 0.5,
          fillOpacity: 0.85,
        })
          .bindTooltip(
            `${Math.floor(entry.timeMinutes / 60).toString().padStart(2, "0")}:${(entry.timeMinutes % 60).toString().padStart(2, "0")} — ${entry.fuelItemName ?? entry.action} (${entry.carbsG}g carbs)`,
            { direction: "top" }
          )
          .addTo(map);
      }
    });

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, [route, schedule, aidStations]);

  if (!route || route.points.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <UFPMark className="w-16 h-10 mx-auto opacity-40" />
        <p className="text-ink-2">No route data.</p>
        <p className="text-sm text-ink-3">
          Upload a GPX file in the planner to see your route on the map.
        </p>
        <Link
          href="/planner"
          className="mt-1 text-sm text-ochre underline underline-offset-2 hover:text-ochre-hover transition-colors"
        >
          Go to planner
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink">Route Map</h2>
        <p className="mt-1 text-sm text-ink-3">
          Track coloured by terrain type. Dots show fuelling events — hover for details.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-ink-3">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-forest" />
          Start
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-clay" />
          Finish
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-ochre" />
          Aid station
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-ochre-soft" />
          Fuel / food
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-ufp-slate" />
          Fluid
        </span>
      </div>

      {/* Map */}
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-xl">
          <div ref={mapRef} style={{ height: 420, width: "100%" }} />
        </CardContent>
      </Card>

      {/* Elevation chart below map */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-ink-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Elevation Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <ElevationChart
            data={route.elevationProfile}
            segments={route.segments}
            height={160}
          />
        </CardContent>
      </Card>
    </div>
  );
}
