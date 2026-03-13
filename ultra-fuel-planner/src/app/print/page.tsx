"use client";

import { useEffect, useState } from "react";
import { loadState } from "@/lib/storage";
import type {
  PlannerOutput,
  FuelItem,
  TerrainType,
  RoutePoint,
  ElevationPoint,
  RouteSegment,
} from "@/types";
import { formatTime, formatDuration, fuelTypeIcon } from "@/lib/utils";
import { terrainLabel } from "@/lib/segmentation";

// ── Print-friendly terrain colours ───────────────────────────────────────────
// Chosen for contrast in both colour and greyscale print.
const TERRAIN_COLOR_PRINT: Record<TerrainType, string> = {
  flat_runnable:      "#6b7280",
  rolling:            "#059669",
  sustained_climb:    "#d97706",
  steep_climb:        "#dc2626",
  technical_descent:  "#1d4ed8",
  runnable_descent:   "#7c3aed",
  recovery:           "#9ca3af",
};
function terrainColorPrint(t: TerrainType): string {
  return TERRAIN_COLOR_PRINT[t] ?? "#6b7280";
}

// ── Route helpers ─────────────────────────────────────────────────────────────
function closestRoutePoint(points: RoutePoint[], km: number): RoutePoint {
  let best = points[0];
  let minDiff = Math.abs(points[0].distanceFromStartKm - km);
  for (const pt of points) {
    const diff = Math.abs(pt.distanceFromStartKm - km);
    if (diff < minDiff) { minDiff = diff; best = pt; }
  }
  return best;
}

function subsample<T>(arr: T[], maxCount: number): T[] {
  if (arr.length <= maxCount) return arr;
  const step = Math.floor(arr.length / maxCount);
  return arr.filter((_, i) => i % step === 0 || i === arr.length - 1);
}

// ── Derive per-section strategy label ────────────────────────────────────────
function sectionStrategyLabel(
  fromKm: number,
  toKm: number,
  schedule: PlannerOutput["schedule"],
  fuelInventory: FuelItem[],
): string {
  const events = schedule.filter(
    (e) =>
      e.distanceKm >= fromKm &&
      e.distanceKm <= toKm &&
      e.action !== "refill_at_aid" &&
      e.action !== "restock_carry",
  );
  const hasDrinkMix = events.some((e) => {
    const item = fuelInventory.find((f) => f.id === e.fuelItemId);
    return item?.type === "drink_mix";
  });
  const discreteTypes = [
    ...new Set(
      events
        .filter((e) => !e.isContinuous)
        .map((e) => fuelInventory.find((f) => f.id === e.fuelItemId)?.type ?? "other"),
    ),
  ].filter((t) => t !== "drink_mix");

  const labels = discreteTypes
    .map((t) =>
      t === "gel" ? "gels" : t === "chew" ? "chews" : t === "bar" ? "bars" : String(t),
    )
    .join(", ");

  if (hasDrinkMix && labels) return `drink mix + ${labels}`;
  if (hasDrinkMix) return "drink mix";
  return labels || "gels";
}

// ── SVG Route Map ─────────────────────────────────────────────────────────────
function PrintRouteMap({ output }: { output: PlannerOutput }) {
  const route = output.eventPlan.route;
  if (!route || route.points.length === 0) return null;

  const SVG_W = 720;
  const SVG_H = 260;
  const PAD = 18;

  // Subsample route points for SVG performance
  const pts = subsample(route.points, 600);
  const lats = pts.map((p) => p.lat);
  const lons = pts.map((p) => p.lon);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const latRange = Math.max(maxLat - minLat, 0.001);
  const lonRange = Math.max(maxLon - minLon, 0.001);
  const midLat = (minLat + maxLat) / 2;

  // Aspect-ratio-preserving projection (equirectangular with cos correction)
  const natAspect = (lonRange * Math.cos((midLat * Math.PI) / 180)) / latRange;
  const chartW = SVG_W - PAD * 2;
  const chartH = SVG_H - PAD * 2;
  let aW = chartW, aH = chartH, oX = PAD, oY = PAD;
  if (natAspect > chartW / chartH) {
    aH = Math.round(chartW / natAspect);
    oY = PAD + (chartH - aH) / 2;
  } else {
    aW = Math.round(chartH * natAspect);
    oX = PAD + (chartW - aW) / 2;
  }

  const proj = (lat: number, lon: number): [number, number] => [
    oX + ((lon - minLon) / lonRange) * aW,
    oY + aH - ((lat - minLat) / latRange) * aH,
  ];

  const fullPts = route.points; // use full set for marker placement
  const inv = output.eventPlan.fuelInventory;
  const drinkMixMarkers = output.schedule.filter((e) => {
    if (!e.isContinuous) return false;
    return inv.find((f) => f.id === e.fuelItemId)?.type === "drink_mix";
  });
  const discreteMarkers = output.schedule.filter(
    (e) => !e.isContinuous && e.action !== "refill_at_aid" && e.action !== "restock_carry",
  );

  return (
    <svg
      width={SVG_W}
      height={SVG_H}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      style={{ display: "block", border: "1px solid #e7ddd3", borderRadius: "4px" }}
    >
      <rect x={0} y={0} width={SVG_W} height={SVG_H} fill="#fdf8f0" />

      {/* Route segments coloured by terrain */}
      {route.segments.map((seg: RouteSegment) => {
        const segPts = subsample(
          fullPts.filter(
            (p) =>
              p.distanceFromStartKm >= seg.startKm &&
              p.distanceFromStartKm <= seg.endKm,
          ),
          80,
        );
        if (segPts.length < 2) return null;
        return (
          <polyline
            key={seg.id}
            points={segPts.map((p) => proj(p.lat, p.lon).join(",")).join(" ")}
            fill="none"
            stroke={terrainColorPrint(seg.terrain)}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}

      {/* Fallback: no segments */}
      {route.segments.length === 0 && (
        <polyline
          points={pts.map((p) => proj(p.lat, p.lon).join(",")).join(" ")}
          fill="none"
          stroke="#d97706"
          strokeWidth={2.5}
        />
      )}

      {/* Carry section boundary diamonds */}
      {output.carryPlans
        .filter((c) => c.fromKm > 0)
        .map((c) => {
          const rp = closestRoutePoint(fullPts, c.fromKm);
          const [cx, cy] = proj(rp.lat, rp.lon);
          return (
            <polygon
              key={c.sectionId}
              points={`${cx},${cy - 6} ${cx + 5},${cy} ${cx},${cy + 6} ${cx - 5},${cy}`}
              fill="#92400e"
              stroke="white"
              strokeWidth={0.8}
              fillOpacity={0.75}
            />
          );
        })}

      {/* Drink mix section starts (blue circles) */}
      {drinkMixMarkers.map((e) => {
        const rp = closestRoutePoint(fullPts, e.distanceKm);
        const [cx, cy] = proj(rp.lat, rp.lon);
        return (
          <circle
            key={e.id}
            cx={cx}
            cy={cy}
            r={5}
            fill="#3b82f6"
            stroke="white"
            strokeWidth={1}
            fillOpacity={0.9}
          />
        );
      })}

      {/* Discrete fuel events */}
      {discreteMarkers.map((e) => {
        const rp = closestRoutePoint(fullPts, e.distanceKm);
        const [cx, cy] = proj(rp.lat, rp.lon);
        const item = inv.find((f) => f.id === e.fuelItemId);
        const color =
          item?.type === "gel"  ? "#f59e0b" :
          item?.type === "chew" ? "#10b981" :
          item?.type === "bar"  ? "#a78bfa" :
                                  "#9ca3af";
        return <circle key={e.id} cx={cx} cy={cy} r={2.5} fill={color} fillOpacity={0.8} />;
      })}

      {/* Aid station markers */}
      {output.eventPlan.aidStations.map((aid) => {
        const rp = closestRoutePoint(fullPts, aid.distanceKm);
        const [cx, cy] = proj(rp.lat, rp.lon);
        return (
          <circle
            key={aid.name}
            cx={cx}
            cy={cy}
            r={5}
            fill="#fb923c"
            stroke="#c2410c"
            strokeWidth={1.5}
          />
        );
      })}

      {/* Start */}
      {(() => {
        const [sx, sy] = proj(route.points[0].lat, route.points[0].lon);
        return (
          <g>
            <circle cx={sx} cy={sy} r={7} fill="#22c55e" stroke="#15803d" strokeWidth={1.5} />
            <text x={sx} y={sy + 3.5} textAnchor="middle" fontSize={8} fill="white" fontWeight="700">S</text>
          </g>
        );
      })()}

      {/* Finish */}
      {(() => {
        const last = route.points[route.points.length - 1];
        const [fx, fy] = proj(last.lat, last.lon);
        return (
          <g>
            <circle cx={fx} cy={fy} r={7} fill="#ef4444" stroke="#b91c1c" strokeWidth={1.5} />
            <text x={fx} y={fy + 3.5} textAnchor="middle" fontSize={8} fill="white" fontWeight="700">F</text>
          </g>
        );
      })()}
    </svg>
  );
}

// ── SVG Elevation Profile ─────────────────────────────────────────────────────
function PrintElevationProfile({ output }: { output: PlannerOutput }) {
  const route = output.eventPlan.route;
  if (!route || route.elevationProfile.length === 0) return null;

  const SVG_W = 720;
  const SVG_H = 160;
  const PL = 40, PR = 10, PT = 12, PB = 22;
  const CW = SVG_W - PL - PR;
  const CH = SVG_H - PT - PB;

  const profile: ElevationPoint[] = subsample(route.elevationProfile, 400);
  const totalKm = route.totalDistanceKm;
  const elevs = profile.map((p) => p.elevationM);
  const minE = Math.min(...elevs);
  const maxE = Math.max(...elevs);
  const eRange = Math.max(maxE - minE, 10);
  const ePad = eRange * 0.08;
  const eLow = minE - ePad;
  const eHigh = maxE + ePad;
  const eSpan = eHigh - eLow;

  const xS = (km: number) => PL + (Math.min(km, totalKm) / totalKm) * CW;
  const yS = (ele: number) => PT + CH - ((ele - eLow) / eSpan) * CH;

  const pathD = profile
    .map((pt, i) => `${i === 0 ? "M" : "L"}${xS(pt.distanceKm).toFixed(1)},${yS(pt.elevationM).toFixed(1)}`)
    .join(" ");
  const areaD = `${pathD} L${xS(totalKm).toFixed(1)},${(PT + CH).toFixed(1)} L${PL},${(PT + CH).toFixed(1)} Z`;

  const inv = output.eventPlan.fuelInventory;
  const drinkMixEvents = output.schedule.filter((e) => {
    return e.isContinuous && inv.find((f) => f.id === e.fuelItemId)?.type === "drink_mix";
  });
  const discreteEvents = output.schedule.filter(
    (e) => !e.isContinuous && e.action !== "refill_at_aid" && e.action !== "restock_carry",
  );
  const aidEvents = output.schedule.filter((e) => e.action === "refill_at_aid");

  // Y-axis ticks: 3 labels
  const yTickVals = [minE, (minE + maxE) / 2, maxE].map((v) => Math.round(v));
  // X-axis ticks: every ~20km, max 6 ticks
  const xTickInterval = totalKm <= 40 ? 10 : totalKm <= 80 ? 20 : totalKm <= 120 ? 25 : 50;
  const xTicks: number[] = [];
  for (let km = 0; km <= totalKm; km += xTickInterval) xTicks.push(km);
  if (xTicks[xTicks.length - 1] < totalKm - 5) xTicks.push(Math.round(totalKm));

  return (
    <svg
      width={SVG_W}
      height={SVG_H}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      style={{ display: "block" }}
    >
      {/* Terrain type bands at top of chart */}
      {route.segments.map((seg: RouteSegment) => {
        const x1 = xS(seg.startKm);
        const w = Math.max(1, xS(seg.endKm) - x1);
        return (
          <rect
            key={seg.id}
            x={x1}
            y={PT}
            width={w}
            height={3}
            fill={terrainColorPrint(seg.terrain)}
            opacity={0.8}
          />
        );
      })}

      {/* Elevation area */}
      <path d={areaD} fill="#b45309" fillOpacity={0.1} />
      <path d={pathD} fill="none" stroke="#b45309" strokeWidth={1.5} />

      {/* Carry section boundaries (dashed vertical) */}
      {output.carryPlans
        .filter((c) => c.fromKm > 0)
        .map((c) => (
          <line
            key={c.sectionId}
            x1={xS(c.fromKm)}
            y1={PT}
            x2={xS(c.fromKm)}
            y2={PT + CH}
            stroke="#92400e"
            strokeWidth={0.8}
            strokeDasharray="3 2"
            opacity={0.5}
          />
        ))}

      {/* Drink mix section spans (blue band just above terrain stripe) */}
      {drinkMixEvents.map((e) => {
        const carry = output.carryPlans.find(
          (c) => c.fromKm <= e.distanceKm && c.toKm >= e.distanceKm,
        );
        const endKm = carry?.toKm ?? Math.min(e.distanceKm + 10, totalKm);
        const x1 = xS(e.distanceKm);
        const w = Math.max(2, xS(endKm) - x1);
        return (
          <rect
            key={e.id}
            x={x1}
            y={PT + 4}
            width={w}
            height={4}
            fill="#3b82f6"
            fillOpacity={0.6}
          />
        );
      })}

      {/* Aid station ticks (below x-axis) */}
      {aidEvents.map((e) => (
        <g key={e.id}>
          <line
            x1={xS(e.distanceKm)}
            y1={PT + CH}
            x2={xS(e.distanceKm)}
            y2={PT + CH + 8}
            stroke="#fb923c"
            strokeWidth={1.5}
          />
          <circle cx={xS(e.distanceKm)} cy={PT + CH + 10} r={2.5} fill="#fb923c" />
        </g>
      ))}

      {/* Discrete fuel ticks */}
      {discreteEvents.map((e) => {
        const item = inv.find((f) => f.id === e.fuelItemId);
        const color =
          item?.type === "gel"  ? "#f59e0b" :
          item?.type === "chew" ? "#10b981" :
          item?.type === "bar"  ? "#a78bfa" :
                                  "#9ca3af";
        return (
          <line
            key={e.id}
            x1={xS(e.distanceKm)}
            y1={PT + CH + 1}
            x2={xS(e.distanceKm)}
            y2={PT + CH + 6}
            stroke={color}
            strokeWidth={1.2}
            opacity={0.75}
          />
        );
      })}

      {/* Horizontal grid */}
      {yTickVals.map((v, i) => (
        <line
          key={i}
          x1={PL}
          y1={yS(v)}
          x2={PL + CW}
          y2={yS(v)}
          stroke="#e7ddd3"
          strokeWidth={0.5}
        />
      ))}

      {/* Y-axis */}
      <line x1={PL} y1={PT} x2={PL} y2={PT + CH} stroke="#d4b896" strokeWidth={0.8} />
      {yTickVals.map((v, i) => (
        <text key={i} x={PL - 4} y={yS(v) + 3} textAnchor="end" fontSize={8} fill="#6b5c4c">
          {v}
        </text>
      ))}

      {/* X-axis */}
      <line x1={PL} y1={PT + CH} x2={PL + CW} y2={PT + CH} stroke="#d4b896" strokeWidth={0.8} />
      {xTicks.map((km) => (
        <text key={km} x={xS(km)} y={PT + CH + 14} textAnchor="middle" fontSize={8} fill="#6b5c4c">
          {km}km
        </text>
      ))}
    </svg>
  );
}

// ── Main print page ───────────────────────────────────────────────────────────
export default function PrintPage() {
  const [output, setOutput] = useState<PlannerOutput | null>(null);

  useEffect(() => {
    const state = loadState();
    if (state.lastPlannerOutput) setOutput(state.lastPlannerOutput);
  }, []);

  useEffect(() => {
    if (output) setTimeout(() => window.print(), 600);
  }, [output]);

  if (!output) {
    return (
      <div style={{ padding: "32px", fontFamily: "system-ui, sans-serif", color: "#6b5c4c" }}>
        No plan found. Generate a plan first.
      </div>
    );
  }

  const { summary, schedule, carryPlans, eventPlan } = output;
  const { fuelInventory, route, aidStations } = eventPlan;

  const fuelEvents = schedule.filter(
    (e) => e.action !== "refill_at_aid" && e.action !== "restock_carry",
  );
  const discreteEvents = fuelEvents.filter((e) => !e.isContinuous);
  const drinkMixEvents = fuelEvents.filter((e) => {
    const item = fuelInventory.find((f) => f.id === e.fuelItemId);
    return e.isContinuous && item?.type === "drink_mix";
  });

  // ── Strategy summary derivation ──────────────────────────────────────────
  const typeCarbTotals: Record<string, number> = {};
  for (const e of fuelEvents) {
    const item = fuelInventory.find((f) => f.id === e.fuelItemId);
    if (item) typeCarbTotals[item.type] = (typeCarbTotals[item.type] ?? 0) + e.carbsG;
  }
  const sortedTypes = Object.entries(typeCarbTotals).sort(([, a], [, b]) => b - a);
  const topDiscreteTypes = sortedTypes
    .filter(([t]) => t !== "drink_mix")
    .slice(0, 2)
    .map(([t]) => (t === "gel" ? "Gels" : t === "chew" ? "Chews" : t === "bar" ? "Bars" : t));
  const primaryFuelsLabel = topDiscreteTypes.join(" + ") || "Gels";
  const drinkMixInPlan = drinkMixEvents.length > 0;

  // ── Group total items by fuel type ───────────────────────────────────────
  const TYPE_ORDER = ["gel", "chew", "bar", "real_food", "drink_mix", "capsule", "other"] as const;
  const TYPE_LABEL: Record<string, string> = {
    gel: "Gels",
    chew: "Chews",
    bar: "Bars & Solids",
    real_food: "Real Food",
    drink_mix: "Drink Mix",
    capsule: "Capsules",
    other: "Other",
  };
  const itemGroups: Record<string, Array<{ id: string; name: string; quantity: number; carbsG: number }>> = {};
  for (const [id, item] of Object.entries(summary.itemTotals)) {
    const fuelItem = fuelInventory.find((f) => f.id === id);
    const type = fuelItem?.type ?? "other";
    if (!itemGroups[type]) itemGroups[type] = [];
    itemGroups[type].push({ id, name: item.name, quantity: item.quantity, carbsG: item.carbsG });
  }

  const hasRoute = Boolean(route && route.points.length > 0);

  // ── Shared style values ───────────────────────────────────────────────────
  const pageStyle: React.CSSProperties = {
    fontFamily: "system-ui, -apple-system, Arial, sans-serif",
    color: "#1a1a1a",
    background: "white",
    padding: "20px 24px",
    maxWidth: "820px",
    margin: "0 auto",
    fontSize: "12px",
    lineHeight: "1.5",
  };

  const sectionHeadingStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 700,
    color: "#92400e",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    margin: "0 0 8px 0",
  };

  const pageBreak: React.CSSProperties = { pageBreakBefore: "always" };

  return (
    <div style={pageStyle}>

      {/* ════════════════════════════════════════════════════════════════════
          PAGE 1 — RACE OVERVIEW
          ════════════════════════════════════════════════════════════════════ */}

      {/* Header */}
      <div style={{ borderBottom: "3px solid #92400e", paddingBottom: "14px", marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "#1a1a1a", lineHeight: 1.1 }}>
              {eventPlan.eventName || "Race Plan"}
            </h1>
            <p style={{ margin: "4px 0 0", color: "#6b5c4c", fontSize: "11px" }}>
              Ultra Fuel Planner · Race Day Card
            </p>
          </div>
          <div style={{ textAlign: "right", color: "#6b5c4c", fontSize: "11px" }}>
            <div style={{ fontWeight: 600 }}>
              {new Date(output.generatedAt).toLocaleDateString("en-GB", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </div>
            {route && (
              <div>
                {route.totalDistanceKm.toFixed(1)} km · ↑{Math.round(route.totalAscentM)} m ↓{Math.round(route.totalDescentM)} m
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary metrics strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        {[
          {
            value: formatDuration(summary.totalRaceDurationMinutes),
            label: "Duration",
            color: "#92400e",
          },
          {
            value: `${summary.avgCarbsPerHour} g/hr`,
            label: "Carbs/hr avg",
            color: "#92400e",
          },
          {
            value: summary.hydrationGuidance
              ? `${summary.hydrationGuidance.rangeMlPerHour[0]}–${summary.hydrationGuidance.rangeMlPerHour[1]} ml`
              : `~${summary.avgFluidPerHourMl} ml`,
            label: "Fluid per hour",
            color: "#1d4ed8",
          },
          {
            value: summary.electrolyteGuidance
              ? summary.electrolyteGuidance.tier === "high"   ? "High"
              : summary.electrolyteGuidance.tier === "moderate" ? "Moderate"
              : "Low"
              : "—",
            label: "Electrolytes",
            color: "#15803d",
          },
        ].map(({ value, label, color }) => (
          <div
            key={label}
            style={{
              textAlign: "center",
              background: "#fdf4eb",
              borderRadius: "6px",
              padding: "12px 8px",
              border: "1px solid #e8d5bb",
            }}
          >
            <div style={{ fontSize: "18px", fontWeight: 700, color }}>{value}</div>
            <div
              style={{
                fontSize: "9px",
                color: "#6b5c4c",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginTop: "2px",
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Strategy overview + Total items — 2-column */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>

        {/* Strategy overview */}
        <div style={{ border: "1px solid #d4b896", borderRadius: "6px", padding: "14px" }}>
          <div style={sectionHeadingStyle}>Strategy Overview</div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <tbody>
              <tr>
                <td style={{ padding: "3px 0", color: "#6b5c4c", width: "38%" }}>Carb target</td>
                <td style={{ padding: "3px 0", fontWeight: 600 }}>
                  {summary.workingCarbTarget ?? summary.avgCarbsPerHour} g/hr
                  {" · "}{Math.round(summary.totalCarbsG)}g total
                </td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0", color: "#6b5c4c" }}>Primary fuels</td>
                <td style={{ padding: "3px 0", fontWeight: 600 }}>{primaryFuelsLabel}</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0", color: "#6b5c4c" }}>Drink mix</td>
                <td
                  style={{
                    padding: "3px 0",
                    fontWeight: 600,
                    color: drinkMixInPlan ? "#1d4ed8" : "#9ca3af",
                  }}
                >
                  {drinkMixInPlan
                    ? `${drinkMixEvents.length} section${drinkMixEvents.length !== 1 ? "s" : ""} — longer / more demanding`
                    : "Not used"}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0", color: "#6b5c4c" }}>Fuelling events</td>
                <td style={{ padding: "3px 0", fontWeight: 600 }}>
                  {discreteEvents.length} scheduled
                </td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0", color: "#6b5c4c" }}>Checkpoints</td>
                <td style={{ padding: "3px 0", fontWeight: 600 }}>
                  {aidStations.length > 0 ? `${aidStations.length} aid stations` : "None entered"}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Inline notes from plan summary */}
          {summary.hydrationGuidance && (
            <div
              style={{
                marginTop: "10px",
                fontSize: "10px",
                color: "#1d4ed8",
                background: "#eff6ff",
                borderRadius: "4px",
                padding: "6px 8px",
              }}
            >
              💧 {summary.hydrationGuidance.rangeMlPerHour[0]}–{summary.hydrationGuidance.rangeMlPerHour[1]} ml/hr
              · {summary.hydrationGuidance.label}
            </div>
          )}
          {summary.electrolyteGuidance && (
            <div
              style={{
                marginTop: "6px",
                fontSize: "10px",
                color: "#15803d",
                background: "#f0fdf4",
                borderRadius: "4px",
                padding: "6px 8px",
              }}
            >
              ⚡ {summary.electrolyteGuidance.label}
            </div>
          )}
        </div>

        {/* Total items required — grouped by type */}
        <div style={{ border: "1px solid #d4b896", borderRadius: "6px", padding: "14px" }}>
          <div style={sectionHeadingStyle}>Total Items Required</div>
          {TYPE_ORDER.filter((t) => itemGroups[t]).map((type) => (
            <div key={type} style={{ marginBottom: "9px" }}>
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "#92400e",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "2px",
                }}
              >
                {TYPE_LABEL[type] ?? type}
              </div>
              {itemGroups[type].map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    padding: "1px 0",
                  }}
                >
                  <span>{item.name}</span>
                  <span style={{ color: "#6b5c4c" }}>
                    ×{item.quantity} · {Math.round(item.carbsG)}g
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          PAGE 2 — RACE EXECUTION
          ════════════════════════════════════════════════════════════════════ */}
      <div style={pageBreak}>
        <div
          style={{
            borderBottom: "2px solid #92400e",
            paddingBottom: "8px",
            marginBottom: "14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>
            {eventPlan.eventName || "Race Plan"} — Execution Plan
          </h2>
          <span style={{ fontSize: "10px", color: "#6b5c4c" }}>
            {formatDuration(summary.totalRaceDurationMinutes)} · {summary.avgCarbsPerHour} g/hr
          </span>
        </div>

        {/* Fuelling schedule table */}
        <div style={sectionHeadingStyle}>Fuelling Schedule</div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px",
            fontSize: "11px",
          }}
        >
          <thead>
            <tr style={{ background: "#f5ece3", borderBottom: "2px solid #d4b896" }}>
              <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 700, width: "54px" }}>Time</th>
              <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 700, width: "38px" }}>km</th>
              <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 700 }}>Fuel / Action</th>
              <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 700, width: "108px" }}>Terrain</th>
              <th style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, width: "50px" }}>Carbs</th>
            </tr>
          </thead>
          <tbody>
            {schedule
              .filter((e) => e.action !== "restock_carry")
              .sort((a, b) => a.timeMinutes - b.timeMinutes)
              .map((entry, i) => {
                const isAid = entry.action === "refill_at_aid";

                // Drink mix — continuous section band
                if (entry.isContinuous) {
                  return (
                    <tr
                      key={entry.id}
                      style={{
                        background: "#eef4ff",
                        borderBottom: "1px solid #c7d9f5",
                        borderLeft: "3px solid #3b82f6",
                      }}
                    >
                      <td style={{ padding: "3px 8px", color: "#4b6ea8", fontStyle: "italic", fontSize: "10px" }}>
                        section
                      </td>
                      <td style={{ padding: "3px 8px", color: "#4b6ea8", fontSize: "10px" }}>
                        {entry.distanceKm.toFixed(1)}
                      </td>
                      <td
                        style={{ padding: "3px 8px", color: "#1d4ed8", fontSize: "11px" }}
                        colSpan={2}
                      >
                        ≋ {entry.fuelItemName ?? "Drink mix"}
                        {entry.quantity > 1 ? ` ×${entry.quantity}` : ""} — sip steadily throughout section
                      </td>
                      <td style={{ padding: "3px 8px", textAlign: "right", color: "#4b6ea8", fontSize: "10px" }}>
                        {entry.carbsG > 0 ? `~${entry.carbsG}g` : "—"}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={entry.id}
                    style={{
                      background: isAid ? "#fef3c7" : i % 2 === 0 ? "white" : "#fafaf8",
                      borderBottom: "1px solid #ede6dd",
                    }}
                  >
                    <td
                      style={{
                        padding: "4px 8px",
                        fontFamily: "monospace",
                        color: "#92400e",
                        fontWeight: 600,
                        fontSize: "11px",
                      }}
                    >
                      {formatTime(entry.timeMinutes)}
                    </td>
                    <td style={{ padding: "4px 8px", color: "#6b5c4c" }}>
                      {entry.distanceKm.toFixed(1)}
                    </td>
                    <td style={{ padding: "4px 8px", fontWeight: isAid ? 700 : 400 }}>
                      {isAid
                        ? `⬤ ${entry.fuelItemName ?? "Aid station"}`
                        : `${fuelTypeIcon(fuelInventory.find((f) => f.id === entry.fuelItemId)?.type ?? "other")} ${entry.fuelItemName ?? entry.action} ×${entry.quantity}`}
                    </td>
                    <td style={{ padding: "4px 8px", color: "#6b5c4c" }}>
                      {terrainLabel(entry.terrain)}
                    </td>
                    <td
                      style={{
                        padding: "4px 8px",
                        textAlign: "right",
                        fontWeight: entry.carbsG > 0 ? 600 : 400,
                        color: entry.carbsG > 0 ? "#92400e" : "#9ca3af",
                      }}
                    >
                      {entry.carbsG > 0 ? `${entry.carbsG}g` : "—"}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {/* Carry plan */}
        {carryPlans.length > 0 && (
          <div>
            <div style={sectionHeadingStyle}>Carry Plan</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {carryPlans.map((plan, idx) => {
                const sectionFuelEvents = fuelEvents.filter(
                  (e) => e.distanceKm >= plan.fromKm && e.distanceKm <= plan.toKm,
                );
                const hasDrinkMix = sectionFuelEvents.some((e) => {
                  return fuelInventory.find((f) => f.id === e.fuelItemId)?.type === "drink_mix";
                });

                return (
                  <div
                    key={plan.sectionId}
                    style={{
                      border: "1px solid #d4b896",
                      borderRadius: "6px",
                      padding: "10px 12px",
                      background: "#fdf8f2",
                    }}
                  >
                    {/* Section header */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: "3px",
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: "12px" }}>
                        {plan.fromLabel} → {plan.toLabel}
                      </span>
                      <span style={{ fontSize: "9px", color: "#9ca3af" }}>§{idx + 1}</span>
                    </div>

                    {/* Section meta */}
                    <div style={{ fontSize: "10px", color: "#6b5c4c", marginBottom: "6px" }}>
                      km {plan.fromKm.toFixed(1)}–{plan.toKm.toFixed(1)}
                      {" · "}~{formatDuration(plan.estimatedDurationMinutes)}
                      {plan.ascentM > 20 && <span> · ↑{plan.ascentM}m</span>}
                      {plan.descentM > 20 && <span> ↓{plan.descentM}m</span>}
                      {" · "}{terrainLabel(plan.dominantTerrain)}
                    </div>

                    {/* Fluid + carbs totals */}
                    <div style={{ display: "flex", gap: "14px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#1d4ed8" }}>
                        🫙 ~{Math.round(plan.fluidToCarryMl / 500) * 0.5}L
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#92400e" }}>
                        ⚡ {Math.round(plan.carbsToCarryG)}g
                      </span>
                      {hasDrinkMix && (
                        <span style={{ fontSize: "10px", color: "#1d4ed8", fontStyle: "italic", alignSelf: "center" }}>
                          ≋ drink mix
                        </span>
                      )}
                    </div>

                    {/* Items list */}
                    {plan.itemsToCarry.length > 0 && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#4a3a2a",
                          borderTop: "1px solid #e7ddd3",
                          paddingTop: "5px",
                        }}
                      >
                        {plan.itemsToCarry.map((item, j) => (
                          <span key={j} style={{ marginRight: "10px" }}>
                            {item.fuelItemName} ×{item.quantity}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* First warning */}
                    {plan.warnings.length > 0 && (
                      <div style={{ fontSize: "10px", color: "#d97706", marginTop: "4px" }}>
                        ⚠ {plan.warnings[0]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          PAGE 3 — COURSE STRATEGY  (only rendered when route data exists)
          ════════════════════════════════════════════════════════════════════ */}
      {hasRoute && route && (
        <div style={pageBreak}>
          <div
            style={{
              borderBottom: "2px solid #92400e",
              paddingBottom: "8px",
              marginBottom: "14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>
              {eventPlan.eventName || "Race Plan"} — Course Strategy
            </h2>
            <span style={{ fontSize: "10px", color: "#6b5c4c" }}>
              {route.totalDistanceKm.toFixed(1)} km · ↑{Math.round(route.totalAscentM)} m
            </span>
          </div>

          {/* Route map */}
          <div style={{ marginBottom: "14px" }}>
            <div style={sectionHeadingStyle}>Route Map</div>
            <PrintRouteMap output={output} />
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                marginTop: "6px",
                fontSize: "9px",
                color: "#6b5c4c",
              }}
            >
              <span style={{ color: "#22c55e", fontWeight: 600 }}>● Start</span>
              <span style={{ color: "#ef4444", fontWeight: 600 }}>● Finish</span>
              <span style={{ color: "#fb923c" }}>● Aid station</span>
              <span style={{ color: "#3b82f6" }}>● Drink mix section</span>
              <span style={{ color: "#f59e0b" }}>● Gel</span>
              <span style={{ color: "#10b981" }}>● Chew</span>
              <span style={{ color: "#92400e" }}>◆ Carry section start</span>
              {Array.from(new Set(route.segments.map((s) => s.terrain))).map((t) => (
                <span key={t} style={{ color: terrainColorPrint(t) }}>
                  — {terrainLabel(t)}
                </span>
              ))}
            </div>
          </div>

          {/* Elevation profile */}
          <div style={{ marginBottom: "14px" }}>
            <div style={sectionHeadingStyle}>Elevation Profile</div>
            <div
              style={{
                border: "1px solid #e7ddd3",
                borderRadius: "4px",
                padding: "8px 4px 4px 4px",
                background: "#fdf8f0",
              }}
            >
              <PrintElevationProfile output={output} />
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "14px",
                marginTop: "5px",
                fontSize: "9px",
                color: "#6b5c4c",
              }}
            >
              <span style={{ color: "#b45309" }}>— Elevation</span>
              <span style={{ color: "#3b82f6" }}>▬ Drink mix section</span>
              <span style={{ color: "#fb923c" }}>● Aid station</span>
              <span style={{ color: "#f59e0b" }}>| Gel</span>
              <span style={{ color: "#10b981" }}>| Chew</span>
              <span>--- Carry section boundary</span>
            </div>
          </div>

          {/* Section overview table */}
          {carryPlans.length > 0 && (
            <div>
              <div style={sectionHeadingStyle}>Section Overview</div>
              <table
                style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}
              >
                <thead>
                  <tr style={{ background: "#f5ece3", borderBottom: "1px solid #d4b896" }}>
                    <th style={{ padding: "5px 8px", textAlign: "left", fontWeight: 700 }}>Section</th>
                    <th style={{ padding: "5px 8px", textAlign: "left", fontWeight: 700 }}>Distance</th>
                    <th style={{ padding: "5px 8px", textAlign: "left", fontWeight: 700 }}>Duration</th>
                    <th style={{ padding: "5px 8px", textAlign: "left", fontWeight: 700 }}>Elevation</th>
                    <th style={{ padding: "5px 8px", textAlign: "left", fontWeight: 700 }}>Terrain</th>
                    <th style={{ padding: "5px 8px", textAlign: "left", fontWeight: 700 }}>Fuel Strategy</th>
                  </tr>
                </thead>
                <tbody>
                  {carryPlans.map((plan, idx) => (
                    <tr
                      key={plan.sectionId}
                      style={{
                        background: idx % 2 === 0 ? "white" : "#fafaf8",
                        borderBottom: "1px solid #ede6dd",
                      }}
                    >
                      <td style={{ padding: "4px 8px", fontWeight: 600 }}>
                        {plan.fromLabel} → {plan.toLabel}
                      </td>
                      <td style={{ padding: "4px 8px", color: "#6b5c4c" }}>
                        {plan.fromKm.toFixed(0)}–{plan.toKm.toFixed(0)} km
                      </td>
                      <td style={{ padding: "4px 8px", color: "#6b5c4c" }}>
                        ~{formatDuration(plan.estimatedDurationMinutes)}
                      </td>
                      <td style={{ padding: "4px 8px", color: "#6b5c4c" }}>
                        {plan.ascentM > 10 ? `↑${plan.ascentM}m` : ""}
                        {plan.descentM > 10 ? ` ↓${plan.descentM}m` : ""}
                        {plan.ascentM <= 10 && plan.descentM <= 10 ? "—" : ""}
                      </td>
                      <td
                        style={{
                          padding: "4px 8px",
                          color: terrainColorPrint(plan.dominantTerrain),
                          fontWeight: 600,
                        }}
                      >
                        {terrainLabel(plan.dominantTerrain)}
                      </td>
                      <td style={{ padding: "4px 8px", color: "#4a3a2a" }}>
                        {sectionStrategyLabel(plan.fromKm, plan.toKm, schedule, fuelInventory)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: "24px",
          paddingTop: "10px",
          borderTop: "1px solid #d4b896",
          fontSize: "9px",
          color: "#9b8b7c",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Ultra Fuel Planner v2.21 · ultrafuelplanner.com</span>
        <span>All times are estimates. Adjust based on real conditions on the day.</span>
      </div>
    </div>
  );
}
