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
  EventIntent,
  RecoveryGuidance,
} from "@/types";
import { formatTime, formatDuration, fuelTypeIcon, terrainColor } from "@/lib/utils";
import { terrainLabel } from "@/lib/segmentation";
import { trackPlanPrinted } from "@/lib/analytics";
import { QRCodeSVG } from "qrcode.react";

// ── Print-friendly terrain colours ────────────────────────────────────────────
// Chosen for contrast on both satellite imagery and greyscale print.
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

// ── Route helpers ──────────────────────────────────────────────────────────────
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

// ── Section strategy label ─────────────────────────────────────────────────────
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

// ── Web Mercator / XYZ tile math ───────────────────────────────────────────────
function lonToTileX(lon: number, z: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, z));
}
function latToTileY(lat: number, z: number): number {
  const lr = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(lr) + 1 / Math.cos(lr)) / Math.PI) / 2) * Math.pow(2, z),
  );
}
function tileXToLon(x: number, z: number): number {
  return (x / Math.pow(2, z)) * 360 - 180;
}
function tileYToLat(y: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}
function chooseBestZoom(minLat: number, maxLat: number, minLon: number, maxLon: number): number {
  // Find highest zoom where tile count stays manageable (≤80 tiles)
  for (let z = 14; z >= 7; z--) {
    const tileCount =
      (lonToTileX(maxLon, z) - lonToTileX(minLon, z) + 1) *
      (latToTileY(minLat, z) - latToTileY(maxLat, z) + 1);
    if (tileCount <= 80) return z;
  }
  return 7;
}

async function loadTile(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`tile-fail:${url}`));
    img.src = url;
  });
}

/**
 * Render a Strava-style static route graphic onto a muted satellite base.
 *
 * Pipeline (v2.26):
 *   1. Fetch Esri World Imagery tiles with CSS filter applied at draw time
 *      — saturate(0.30) brightness(0.55) — so the basemap is subdued before
 *      any route graphics are rendered.
 *   2. Radial vignette (dark edges, transparent centre) to pull the eye
 *      inward toward the route.
 *   3. Route rendered in two passes: thick white halo (11px) then solid
 *      brand-orange line (5.5px) — route is the dominant visual element.
 *   4. Markers in strict z-order: carry rings → fuel dots → drink mix
 *      diamonds → aid stations → start / finish.
 *   5. Canvas-embedded legend (bottom-left).
 *   6. 2× DPI canvas throughout for crisp PDF/print output.
 *   7. window.print() is gated on this function resolving — no tile is
 *      missing when the PDF is captured.
 */
async function renderSatelliteMap(
  output: PlannerOutput,
  canvasW = 880,
  canvasH = 480,
): Promise<string | null> {
  const route = output.eventPlan.route;
  if (!route || route.points.length < 2) return null;

  const points = route.points;
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);
  const rawMinLat = Math.min(...lats), rawMaxLat = Math.max(...lats);
  const rawMinLon = Math.min(...lons), rawMaxLon = Math.max(...lons);

  // 5% padding — tight framing so the route occupies ~80–90% of the frame
  const latPad = Math.max((rawMaxLat - rawMinLat) * 0.05, 0.003);
  const lonPad = Math.max((rawMaxLon - rawMinLon) * 0.05, 0.004);
  const bMinLat = rawMinLat - latPad;
  const bMaxLat = rawMaxLat + latPad;
  const bMinLon = rawMinLon - lonPad;
  const bMaxLon = rawMaxLon + lonPad;

  const zoom = chooseBestZoom(bMinLat, bMaxLat, bMinLon, bMaxLon);

  const tx0 = lonToTileX(bMinLon, zoom);
  const tx1 = lonToTileX(bMaxLon, zoom);
  const ty0 = latToTileY(bMaxLat, zoom);
  const ty1 = latToTileY(bMinLat, zoom);

  const totalTX = tx1 - tx0 + 1;
  const totalTY = ty1 - ty0 + 1;
  const tileW = canvasW / totalTX;
  const tileH = canvasH / totalTY;

  const lonLeft  = tileXToLon(tx0, zoom);
  const lonRight = tileXToLon(tx1 + 1, zoom);
  const latTop   = tileYToLat(ty0, zoom);
  const latBot   = tileYToLat(ty1 + 1, zoom);

  const mercY = (lat: number) =>
    Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 180 / 2));
  const mTop = mercY(latTop);
  const mBot = mercY(latBot);
  const project = (lat: number, lon: number): [number, number] => [
    ((lon - lonLeft) / (lonRight - lonLeft)) * canvasW,
    ((mTop - mercY(lat)) / (mTop - mBot)) * canvasH,
  ];

  // 2× DPI canvas — all logical coordinates stay in (0..canvasW, 0..canvasH)
  const canvas = document.createElement("canvas");
  canvas.width  = canvasW * 2;
  canvas.height = canvasH * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);

  // Fallback background for tiles that fail
  ctx.fillStyle = "#1c1917";
  ctx.fillRect(0, 0, canvasW, canvasH);

  // ── 1. Tiles — drawn with desaturation + darkening filter applied ────────────
  // Setting ctx.filter BEFORE the Promise.all means every tile's .then() draws
  // with the muted filter. Filter is safe with async because JS is single-threaded
  // and the reset only happens after await Promise.all resolves.
  ctx.filter = "saturate(0.55) brightness(0.72) contrast(0.85)";
  const tileJobs: Promise<void>[] = [];
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const px = (tx - tx0) * tileW;
      const py = (ty - ty0) * tileH;
      const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${tx}`;
      tileJobs.push(
        loadTile(url)
          .then((img) => ctx.drawImage(img, px, py, tileW, tileH))
          .catch(() => {
            ctx.fillStyle = "#292524";
            ctx.fillRect(px, py, tileW, tileH);
          }),
      );
    }
  }
  await Promise.all(tileJobs);
  ctx.filter = "none";

  // ── 2. Subtle vignette — very light edge fade only ──────────────────────────
  // Matches in-app map feel: almost no darkening at edges.
  {
    const vig = ctx.createRadialGradient(
      canvasW / 2, canvasH / 2, Math.min(canvasW, canvasH) * 0.35,
      canvasW / 2, canvasH / 2, Math.max(canvasW, canvasH) * 0.82,
    );
    vig.addColorStop(0,   "rgba(0,0,0,0)");
    vig.addColorStop(1,   "rgba(0,0,0,0.18)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  const inv = output.eventPlan.fuelInventory;

  // ── Route path helper ────────────────────────────────────────────────────────
  function strokePath(pts: RoutePoint[], lineW: number, style: string) {
    const sub = subsample(pts, 400);
    if (sub.length < 2) return;
    ctx.save();
    ctx.strokeStyle = style;
    ctx.lineWidth = lineW;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    const [x0, y0] = project(sub[0].lat, sub[0].lon);
    ctx.moveTo(x0, y0);
    for (let i = 1; i < sub.length; i++) {
      const [x, y] = project(sub[i].lat, sub[i].lon);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // ── 3. Route — terrain-segmented, matching in-app RouteMapView palette ───────
  // Two passes per segment: dark halo for legibility on satellite, then the
  // terrain color on top. Same color language as the in-app Leaflet map.
  if (route.segments.length > 0) {
    // Pass A: dark halo across all segments
    for (const seg of route.segments) {
      strokePath(
        points.filter((p) => p.distanceFromStartKm >= seg.startKm && p.distanceFromStartKm <= seg.endKm),
        7, "rgba(0,0,0,0.40)",
      );
    }
    // Pass B: terrain color per segment
    for (const seg of route.segments) {
      strokePath(
        points.filter((p) => p.distanceFromStartKm >= seg.startKm && p.distanceFromStartKm <= seg.endKm),
        4.5, terrainColor(seg.terrain),
      );
    }
  } else {
    // No segments — fallback to amber (matches in-app no-segment fallback)
    strokePath(points, 7, "rgba(0,0,0,0.40)");
    strokePath(points, 4.5, "#f59e0b");
  }

  // ── 4a. Carry section boundaries — white rings ───────────────────────────────
  // Thin rings sit just above the route line without obscuring it.
  for (const c of output.carryPlans.filter((cp) => cp.fromKm > 0)) {
    const rp = closestRoutePoint(points, c.fromKm);
    const [cx, cy] = project(rp.lat, rp.lon);
    ctx.save();
    // Outer white ring
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.90)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // Tiny inner dot for readability at small sizes
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fill();
    ctx.restore();
  }

  // ── 4b. Fuel events — amber for all food, blue for fluid, violet for capsule ──
  // Matches in-app RouteMapView marker color language exactly.
  for (const e of output.schedule.filter(
    (ev) => !ev.isContinuous && ev.action !== "refill_at_aid" && ev.action !== "restock_carry",
  )) {
    const rp = closestRoutePoint(points, e.distanceKm);
    const [cx, cy] = project(rp.lat, rp.lon);
    const color =
      e.action === "drink_fluid" ? "#3b82f6" :  // blue — fluid
      e.action === "take_capsule" ? "#a78bfa" : // violet — capsule
      "#f59e0b";                                // amber — all food (gel/chew/bar/real_food)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  }

  // ── 4e. Drink mix section starts — purple diamonds ───────────────────────────
  for (const e of output.schedule.filter(
    (ev) => ev.isContinuous && inv.find((f) => f.id === ev.fuelItemId)?.type === "drink_mix",
  )) {
    const rp = closestRoutePoint(points, e.distanceKm);
    const [cx, cy] = project(rp.lat, rp.lon);
    const S = 6;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#a855f7";   // purple-500
    ctx.fillRect(-S, -S, S * 2, S * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.70)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-S, -S, S * 2, S * 2);
    ctx.restore();
  }

  // ── 5. Aid stations — solid orange with white border ─────────────────────────
  for (const aid of output.eventPlan.aidStations) {
    const rp = closestRoutePoint(points, aid.distanceKm);
    const [cx, cy] = project(rp.lat, rp.lon);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#fb923c";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // ── 6. Start marker — green circle, labelled ────────────────────────────────
  {
    const [sx, sy] = project(points[0].lat, points[0].lon);
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx, sy, 13, 0, Math.PI * 2);
    ctx.fillStyle = "#22c55e";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.font = "bold 11px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("S", sx, sy);
    ctx.restore();
  }

  // ── 7. Finish marker — red circle, labelled ──────────────────────────────────
  {
    const last = points[points.length - 1];
    const [fx, fy] = project(last.lat, last.lon);
    ctx.save();
    ctx.beginPath();
    ctx.arc(fx, fy, 13, 0, Math.PI * 2);
    ctx.fillStyle = "#ef4444";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.font = "bold 11px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("F", fx, fy);
    ctx.restore();
  }

  // ── 8. Canvas legend (bottom-left) ───────────────────────────────────────────
  {
    const hasDrinkMix = output.schedule.some(
      (ev) => ev.isContinuous && inv.find((f) => f.id === ev.fuelItemId)?.type === "drink_mix",
    );
    const hasFluid = output.schedule.some((ev) => ev.action === "drink_fluid");
    const hasCapsule = output.schedule.some((ev) => ev.action === "take_capsule");
    const hasFood = output.schedule.some(
      (ev) => !ev.isContinuous && ev.action !== "refill_at_aid" && ev.action !== "restock_carry"
        && ev.action !== "drink_fluid" && ev.action !== "take_capsule",
    );
    type LShape = "circle" | "diamond" | "ring";
    const legendItems: Array<{ color: string; label: string; shape: LShape }> = [
      { color: "#22c55e", label: "Start",       shape: "circle"  },
      { color: "#ef4444", label: "Finish",      shape: "circle"  },
      ...(output.eventPlan.aidStations.length > 0
        ? [{ color: "#fb923c", label: "Aid station", shape: "circle" as LShape }] : []),
      ...(hasDrinkMix
        ? [{ color: "#a855f7", label: "Drink mix", shape: "diamond" as LShape }] : []),
      ...(hasFood
        ? [{ color: "#f59e0b", label: "Fuel / food", shape: "circle" as LShape }] : []),
      ...(hasFluid
        ? [{ color: "#3b82f6", label: "Fluid",      shape: "circle" as LShape }] : []),
      ...(hasCapsule
        ? [{ color: "#a78bfa", label: "Capsule",    shape: "circle" as LShape }] : []),
      { color: "rgba(255,255,255,0.85)", label: "Carry section", shape: "ring" },
    ];

    const LX = 8;
    const boxH = legendItems.length * 14 + 10;
    const LY = canvasH - 8 - boxH;
    const boxW = 124;
    const r = 4;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.68)";
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(LX + r, LY);
    ctx.lineTo(LX + boxW - r, LY);
    ctx.arcTo(LX + boxW, LY, LX + boxW, LY + r, r);
    ctx.lineTo(LX + boxW, LY + boxH - r);
    ctx.arcTo(LX + boxW, LY + boxH, LX + boxW - r, LY + boxH, r);
    ctx.lineTo(LX + r, LY + boxH);
    ctx.arcTo(LX, LY + boxH, LX, LY + boxH - r, r);
    ctx.lineTo(LX, LY + r);
    ctx.arcTo(LX, LY, LX + r, LY, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    legendItems.forEach((item, i) => {
      const iy = LY + 8 + i * 14;
      const ix = LX + 12;
      ctx.save();
      if (item.shape === "diamond") {
        ctx.translate(ix, iy);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = item.color;
        ctx.fillRect(-4, -4, 8, 8);
        ctx.strokeStyle = "rgba(255,255,255,0.45)";
        ctx.lineWidth = 0.75;
        ctx.strokeRect(-4, -4, 8, 8);
      } else if (item.shape === "ring") {
        ctx.beginPath();
        ctx.arc(ix, iy, 4.5, 0, Math.PI * 2);
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ix, iy, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(ix, iy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.lineWidth = 0.75;
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.font = "9px Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(item.label, LX + 22, iy);
    });
    ctx.restore();
  }

  try {
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

// ── SVG Elevation Profile ──────────────────────────────────────────────────────
function PrintElevationProfile({ output }: { output: PlannerOutput }) {
  const route = output.eventPlan.route;
  if (!route || route.elevationProfile.length === 0) return null;

  const SVG_W = 710;
  const SVG_H = 160;
  const PL = 42, PR = 10, PT = 14, PB = 24;
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
  const drinkMixEvents = output.schedule.filter(
    (e) => e.isContinuous && inv.find((f) => f.id === e.fuelItemId)?.type === "drink_mix",
  );
  const discreteEvents = output.schedule.filter(
    (e) => !e.isContinuous && e.action !== "refill_at_aid" && e.action !== "restock_carry",
  );
  const aidEvents = output.schedule.filter((e) => e.action === "refill_at_aid");

  const yTickVals = [minE, (minE + maxE) / 2, maxE].map((v) => Math.round(v));
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
      {/* Terrain type bands — 3px strip at chart top */}
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
            opacity={0.85}
          />
        );
      })}

      {/* Drink mix spans — blue band just below terrain stripe */}
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
            fillOpacity={0.55}
          />
        );
      })}

      {/* Elevation area fill */}
      <path d={areaD} fill="#b45309" fillOpacity={0.12} />
      <path d={pathD} fill="none" stroke="#b45309" strokeWidth={1.5} />

      {/* Carry section boundaries — dashed verticals */}
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

      {/* Aid station ticks below x-axis */}
      {aidEvents.map((e) => (
        <g key={e.id}>
          <line
            x1={xS(e.distanceKm)} y1={PT + CH}
            x2={xS(e.distanceKm)} y2={PT + CH + 8}
            stroke="#fb923c" strokeWidth={1.5}
          />
          <circle cx={xS(e.distanceKm)} cy={PT + CH + 11} r={2.5} fill="#fb923c" />
        </g>
      ))}

      {/* Discrete fuel ticks below x-axis */}
      {discreteEvents.map((e) => {
        const item = inv.find((f) => f.id === e.fuelItemId);
        const color =
          item?.type === "gel"  ? "#f59e0b" :
          item?.type === "chew" ? "#10b981" :
          item?.type === "bar"  ? "#a78bfa" : "#9ca3af";
        return (
          <line
            key={e.id}
            x1={xS(e.distanceKm)} y1={PT + CH + 1}
            x2={xS(e.distanceKm)} y2={PT + CH + 6}
            stroke={color} strokeWidth={1.2} opacity={0.8}
          />
        );
      })}

      {/* Horizontal grid lines */}
      {yTickVals.map((v, i) => (
        <line
          key={i}
          x1={PL} y1={yS(v)} x2={PL + CW} y2={yS(v)}
          stroke="#e7ddd3" strokeWidth={0.5}
        />
      ))}

      {/* Y axis */}
      <line x1={PL} y1={PT} x2={PL} y2={PT + CH} stroke="#d4b896" strokeWidth={0.8} />
      {yTickVals.map((v, i) => (
        <text key={i} x={PL - 4} y={yS(v) + 3} textAnchor="end" fontSize={8} fill="#6b5c4c">
          {v}m
        </text>
      ))}

      {/* X axis */}
      <line x1={PL} y1={PT + CH} x2={PL + CW} y2={PT + CH} stroke="#d4b896" strokeWidth={0.8} />
      {xTicks.map((km) => (
        <text key={km} x={xS(km)} y={PT + CH + 16} textAnchor="middle" fontSize={8} fill="#6b5c4c">
          {km}km
        </text>
      ))}
    </svg>
  );
}

// ── Print CSS ──────────────────────────────────────────────────────────────────
// Injected as a <style> tag so it applies without Tailwind and works in print.
const PRINT_CSS = `
  @page {
    size: A4 portrait;
    margin: 12mm 15mm 13mm 15mm;
  }
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
    .ufp-wrapper { padding: 0 !important; background: white !important; }
    .ufp-page {
      padding: 0 !important;
      max-width: none !important;
      box-shadow: none !important;
      margin: 0 !important;
      border-radius: 0 !important;
      border: none !important;
    }
    .ufp-break {
      break-before: page;
      page-break-before: always;
    }
    .ufp-nobreak {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    tr { break-inside: avoid; page-break-inside: avoid; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
  }
  @media screen {
    html, body { background: #ccc4b8 !important; margin: 0; }
    .ufp-wrapper { padding: 28px 16px; min-height: 100vh; }
    .ufp-page {
      background: white;
      max-width: 800px;
      margin: 0 auto 36px auto;
      padding: 24px 28px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.2);
      border-radius: 2px;
    }
    .ufp-page:first-of-type { margin-top: 0; }
  }
`;

// ── Main print page ────────────────────────────────────────────────────────────
// Architecture (v2.26 — Strava-style map: muted basemap, orange route hero, radial vignette, redesigned markers):
export default function PrintPage() {
  const [output, setOutput]       = useState<PlannerOutput | null>(null);
  const [mapDataUrl, setMapDataUrl] = useState<string | null>(null);
  const [mapReady, setMapReady]   = useState(false);
  const [mapError, setMapError]   = useState(false);

  // Load persisted plan.
  // eventPlan.route is stripped before saving to avoid localStorage quota
  // errors on large GPX files (it duplicates parsedRoute). Reconstruct it here.
  useEffect(() => {
    const state = loadState();
    let planOutput = state.lastPlannerOutput;
    if (planOutput && !planOutput.eventPlan.route && state.parsedRoute) {
      planOutput = { ...planOutput, eventPlan: { ...planOutput.eventPlan, route: state.parsedRoute } };
    }
    if (planOutput) setOutput(planOutput);
  }, []);

  // Render satellite map asynchronously once output is available
  useEffect(() => {
    if (!output) return;
    const route = output.eventPlan.route;
    if (!route || route.points.length < 2) {
      setMapReady(true);
      return;
    }
    renderSatelliteMap(output)
      .then((url) => {
        if (url) setMapDataUrl(url);
        else setMapError(true);
        setMapReady(true);
      })
      .catch(() => {
        setMapError(true);
        setMapReady(true);
      });
  }, [output]);

  // Trigger browser print only after satellite map has fully loaded
  useEffect(() => {
    if (!output || !mapReady) return;
    const t = setTimeout(() => {
      trackPlanPrinted();
      window.print();
    }, 500);
    return () => clearTimeout(t);
  }, [output, mapReady]);

  // ── Loading / error states ─────────────────────────────────────────────────
  if (!output) {
    return (
      <div style={{ padding: "60px 32px", fontFamily: "system-ui, sans-serif", color: "#6b5c4c", textAlign: "center" }}>
        <p style={{ fontSize: "14px" }}>No plan found. Generate a plan first, then return to print.</p>
      </div>
    );
  }

  if (!mapReady) {
    return (
      <div style={{ padding: "60px 32px", fontFamily: "system-ui, sans-serif", color: "#6b5c4c", textAlign: "center" }}>
        <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
          Loading satellite imagery…
        </p>
        <p style={{ fontSize: "12px", color: "#9b8b7c" }}>
          Fetching map tiles for your route. This usually takes 5–15 seconds.
        </p>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
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

  const TYPE_ORDER = ["gel", "chew", "bar", "real_food", "drink_mix", "capsule", "other"] as const;
  const TYPE_LABEL: Record<string, string> = {
    gel: "Gels", chew: "Chews", bar: "Bars & Solids", real_food: "Real Food",
    drink_mix: "Drink Mix", capsule: "Capsules", other: "Other",
  };
  const itemGroups: Record<string, Array<{ id: string; name: string; quantity: number; carbsG: number }>> = {};
  for (const [id, item] of Object.entries(summary.itemTotals)) {
    const fuelItem = fuelInventory.find((f) => f.id === id);
    const type = fuelItem?.type ?? "other";
    if (!itemGroups[type]) itemGroups[type] = [];
    itemGroups[type].push({ id, name: item.name, quantity: item.quantity, carbsG: item.carbsG });
  }

  const hasRoute = Boolean(route && route.points.length > 0);

  // ── Shared inline styles ───────────────────────────────────────────────────
  const pageContentStyle: React.CSSProperties = {
    fontFamily: "system-ui, -apple-system, Arial, sans-serif",
    color: "#1a1a1a",
    fontSize: "12px",
    lineHeight: "1.5",
  };

  const sectionHeadingStyle: React.CSSProperties = {
    fontSize: "10px",
    fontWeight: 700,
    color: "#92400e",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    margin: "0 0 7px 0",
    paddingBottom: "3px",
    borderBottom: "1px solid #e8d5bb",
  };

  const pageHeaderStyle: React.CSSProperties = {
    borderBottom: "2px solid #92400e",
    paddingBottom: "8px",
    marginBottom: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
  };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="ufp-wrapper">

        {/* ══════════════════════════════════════════════════════════════════
            PAGE 1 — RACE OVERVIEW
            ══════════════════════════════════════════════════════════════════ */}
        <div className="ufp-page" style={pageContentStyle}>

          {/* Race header */}
          <div style={{ borderBottom: "3px solid #92400e", paddingBottom: "14px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "#1a1a1a", lineHeight: 1.1 }}>
                  {eventPlan.eventName || "Race Plan"}
                </h1>
                <p style={{ margin: "4px 0 0", color: "#6b5c4c", fontSize: "11px" }}>
                  Ultra Fuel Planner · {printIntentLabel(eventPlan.eventIntent)} · <span style={{ color: "#92400e", fontWeight: 600 }}>ultrafuelplanner.com</span>
                </p>
              </div>
              <div style={{ textAlign: "right", color: "#6b5c4c", fontSize: "11px", lineHeight: 1.7 }}>
                <div style={{ fontWeight: 600 }}>
                  {new Date(output.generatedAt).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </div>
                {route && (
                  <>
                    <div>{route.totalDistanceKm.toFixed(1)} km</div>
                    <div>↑{Math.round(route.totalAscentM)} m · ↓{Math.round(route.totalDescentM)} m</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Summary metrics strip — 4 columns */}
          <div
            className="ufp-nobreak"
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "16px" }}
          >
            {[
              { value: formatDuration(summary.totalRaceDurationMinutes), label: "Est. Duration", color: "#92400e" },
              { value: `${summary.avgCarbsPerHour} g/hr`, label: "Carbs / hr", color: "#92400e" },
              {
                value: summary.hydrationGuidance
                  ? `${summary.hydrationGuidance.rangeMlPerHour[0]}–${summary.hydrationGuidance.rangeMlPerHour[1]} ml`
                  : `~${summary.avgFluidPerHourMl} ml`,
                label: "Fluid / hr",
                color: "#1d4ed8",
              },
              {
                value: summary.electrolyteGuidance
                  ? summary.electrolyteGuidance.tier === "high"     ? "High"
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
                  borderRadius: "5px",
                  padding: "11px 8px",
                  border: "1px solid #e8d5bb",
                }}
              >
                <div style={{ fontSize: "17px", fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: "9px", color: "#6b5c4c", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Strategy overview + Total items — 2-column */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>

            {/* Strategy overview */}
            <div className="ufp-nobreak" style={{ border: "1px solid #d4b896", borderRadius: "6px", padding: "13px" }}>
              <div style={sectionHeadingStyle}>Strategy Overview</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "3px 0", color: "#6b5c4c", width: "40%" }}>Carb target</td>
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
                    <td style={{ padding: "3px 0", fontWeight: 600, color: drinkMixInPlan ? "#1d4ed8" : "#9ca3af" }}>
                      {drinkMixInPlan
                        ? `${drinkMixEvents.length} section${drinkMixEvents.length !== 1 ? "s" : ""}`
                        : "Not used"}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "3px 0", color: "#6b5c4c" }}>Fuelling events</td>
                    <td style={{ padding: "3px 0", fontWeight: 600 }}>{discreteEvents.length} scheduled</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "3px 0", color: "#6b5c4c" }}>Checkpoints</td>
                    <td style={{ padding: "3px 0", fontWeight: 600 }}>
                      {aidStations.length > 0 ? `${aidStations.length} aid station${aidStations.length !== 1 ? "s" : ""}` : "None entered"}
                    </td>
                  </tr>
                </tbody>
              </table>

              {summary.hydrationGuidance && (
                <div style={{ marginTop: "10px", fontSize: "10px", color: "#1d4ed8", background: "#eff6ff", borderRadius: "4px", padding: "6px 8px" }}>
                  💧 {summary.hydrationGuidance.rangeMlPerHour[0]}–{summary.hydrationGuidance.rangeMlPerHour[1]} ml/hr · {summary.hydrationGuidance.label}
                </div>
              )}
              {summary.electrolyteGuidance && (
                <div style={{ marginTop: "6px", fontSize: "10px", color: "#15803d", background: "#f0fdf4", borderRadius: "4px", padding: "6px 8px" }}>
                  ⚡ {summary.electrolyteGuidance.label}
                </div>
              )}
            </div>

            {/* Total items required */}
            <div className="ufp-nobreak" style={{ border: "1px solid #d4b896", borderRadius: "6px", padding: "13px" }}>
              <div style={sectionHeadingStyle}>Total Items Required</div>
              {TYPE_ORDER.filter((t) => itemGroups[t]).map((type) => (
                <div key={type} style={{ marginBottom: "8px" }}>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>
                    {TYPE_LABEL[type] ?? type}
                  </div>
                  {itemGroups[type].map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "1px 0" }}>
                      <span>{item.name}</span>
                      <span style={{ color: "#6b5c4c" }}>×{item.quantity} · {Math.round(item.carbsG)}g</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

        </div>{/* /PAGE 1 */}

        {/* ══════════════════════════════════════════════════════════════════
            PAGE 2 — EXECUTION PLAN
            ══════════════════════════════════════════════════════════════════ */}
        <div className="ufp-page ufp-break" style={pageContentStyle}>

          {/* Page header */}
          <div style={pageHeaderStyle}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>
              {eventPlan.eventName || "Race Plan"} — Execution Plan
            </h2>
            <span style={{ fontSize: "10px", color: "#6b5c4c" }}>
              {formatDuration(summary.totalRaceDurationMinutes)} · {summary.avgCarbsPerHour} g/hr avg
            </span>
          </div>

          {/* ── Fuelling Schedule ── */}
          <div style={{ marginBottom: "20px" }}>
            <div style={sectionHeadingStyle}>Fuelling Schedule</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ background: "#f5ece3", borderBottom: "2px solid #d4b896" }}>
                  <th style={{ padding: "6px 7px", textAlign: "left", fontWeight: 700, width: "52px" }}>Time</th>
                  <th style={{ padding: "6px 7px", textAlign: "left", fontWeight: 700, width: "36px" }}>km</th>
                  <th style={{ padding: "6px 7px", textAlign: "left", fontWeight: 700 }}>Fuel / Action</th>
                  <th style={{ padding: "6px 7px", textAlign: "left", fontWeight: 700, width: "104px" }}>Terrain</th>
                  <th style={{ padding: "6px 7px", textAlign: "right", fontWeight: 700, width: "48px" }}>Carbs</th>
                </tr>
              </thead>
              <tbody>
                {schedule
                  .filter((e) => e.action !== "restock_carry")
                  .sort((a, b) => a.timeMinutes - b.timeMinutes)
                  .map((entry, i) => {
                    const isAid = entry.action === "refill_at_aid";

                    // Drink mix — continuous section row
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
                          <td style={{ padding: "3px 7px", color: "#4b6ea8", fontStyle: "italic", fontSize: "10px" }}>
                            section
                          </td>
                          <td style={{ padding: "3px 7px", color: "#4b6ea8", fontSize: "10px" }}>
                            {entry.distanceKm.toFixed(1)}
                          </td>
                          <td style={{ padding: "3px 7px", color: "#1d4ed8", fontSize: "11px" }} colSpan={2}>
                            ≋ {entry.fuelItemName ?? "Drink mix"}
                            {entry.quantity > 1 ? ` ×${entry.quantity}` : ""} — sip steadily through section
                          </td>
                          <td style={{ padding: "3px 7px", textAlign: "right", color: "#4b6ea8", fontSize: "10px" }}>
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
                        <td style={{ padding: "4px 7px", fontFamily: "monospace", color: "#92400e", fontWeight: 600, fontSize: "11px" }}>
                          {formatTime(entry.timeMinutes)}
                        </td>
                        <td style={{ padding: "4px 7px", color: "#6b5c4c" }}>
                          {entry.distanceKm.toFixed(1)}
                        </td>
                        <td style={{ padding: "4px 7px", fontWeight: isAid ? 700 : 400 }}>
                          {isAid
                            ? `⬤ ${entry.fuelItemName ?? "Aid station"}`
                            : `${fuelTypeIcon(fuelInventory.find((f) => f.id === entry.fuelItemId)?.type ?? "other")} ${entry.fuelItemName ?? entry.action} ×${entry.quantity}`}
                        </td>
                        <td style={{ padding: "4px 7px", color: "#6b5c4c" }}>
                          {terrainLabel(entry.terrain)}
                        </td>
                        <td style={{ padding: "4px 7px", textAlign: "right", fontWeight: entry.carbsG > 0 ? 600 : 400, color: entry.carbsG > 0 ? "#92400e" : "#9ca3af" }}>
                          {entry.carbsG > 0 ? `${entry.carbsG}g` : "—"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* ── Carry Plan ── */}
          {carryPlans.length > 0 && (
            <div>
              <div style={sectionHeadingStyle}>Carry Plan</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {carryPlans.map((plan, idx) => {
                  const sectionFuelEvents = fuelEvents.filter(
                    (e) => e.distanceKm >= plan.fromKm && e.distanceKm <= plan.toKm,
                  );
                  const hasDrinkMix = sectionFuelEvents.some(
                    (e) => fuelInventory.find((f) => f.id === e.fuelItemId)?.type === "drink_mix",
                  );

                  return (
                    <div
                      key={plan.sectionId}
                      className="ufp-nobreak"
                      style={{
                        border: "1px solid #d4b896",
                        borderRadius: "6px",
                        padding: "10px 12px",
                        background: "#fdf8f2",
                      }}
                    >
                      {/* Section header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "3px" }}>
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
                        {" · "}{plan.sectionCharacter}
                      </div>

                      {/* Fluid + carbs */}
                      <div style={{ display: "flex", gap: "14px", marginBottom: "6px", alignItems: "center" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#1d4ed8" }}>
                          🫙 ~{Math.round(plan.fluidToCarryMl / 500) * 0.5}L
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#92400e" }}>
                          ⚡ {Math.round(plan.carbsToCarryG)}g
                        </span>
                        {hasDrinkMix && (
                          <span style={{ fontSize: "10px", color: "#1d4ed8", fontStyle: "italic" }}>
                            ≋ drink mix
                          </span>
                        )}
                      </div>

                      {/* Items list */}
                      {plan.itemsToCarry.length > 0 && (
                        <div style={{ fontSize: "10px", color: "#4a3a2a", borderTop: "1px solid #e7ddd3", paddingTop: "5px" }}>
                          {plan.itemsToCarry.map((item, j) => (
                            <span key={j} style={{ marginRight: "10px" }}>
                              {item.fuelItemName} ×{item.quantity}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Warning */}
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

          {/* ── Recovery guidance (training & practice sessions only) ── */}
          {summary.recoveryGuidance && (
            <PrintRecoveryGuidance guidance={summary.recoveryGuidance} sectionHeadingStyle={sectionHeadingStyle} />
          )}

        </div>{/* /PAGE 2 */}

        {/* ══════════════════════════════════════════════════════════════════
            PAGE 3 — COURSE STRATEGY  (only when route data is present)
            ══════════════════════════════════════════════════════════════════ */}
        {hasRoute && route && (
          <div className="ufp-page ufp-break" style={pageContentStyle}>

            {/* Page header */}
            <div style={pageHeaderStyle}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>
                {eventPlan.eventName || "Race Plan"} — Course Strategy
              </h2>
              <span style={{ fontSize: "10px", color: "#6b5c4c" }}>
                {route.totalDistanceKm.toFixed(1)} km · ↑{Math.round(route.totalAscentM)} m · ↓{Math.round(route.totalDescentM)} m
              </span>
            </div>

            {/* ── Satellite route map ── */}
            <div className="ufp-nobreak" style={{ marginBottom: "16px" }}>
              <div style={sectionHeadingStyle}>Route Map</div>

              {mapDataUrl ? (
                // Canvas-rendered satellite map — embedded as PNG data URL (no network dependency in PDF)
                <img
                  src={mapDataUrl}
                  alt="Satellite route map"
                  style={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                    borderRadius: "4px",
                    border: "1px solid #d4b896",
                  }}
                />
              ) : mapError ? (
                // Satellite tiles failed (CORS or network) — fallback SVG map
                <SvgRouteFallback output={output} />
              ) : null}

              {/* Map legend */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "6px", fontSize: "9px", color: "#6b5c4c" }}>
                <span style={{ color: "#22c55e", fontWeight: 600 }}>● Start</span>
                <span style={{ color: "#ef4444", fontWeight: 600 }}>● Finish</span>
                {aidStations.length > 0 && <span style={{ color: "#fb923c" }}>● Aid station</span>}
                {drinkMixInPlan && <span style={{ color: "#a855f7" }}>◆ Drink mix section</span>}
                <span style={{ color: "#f97316" }}>● Gel</span>
                <span style={{ color: "#60a5fa" }}>● Chew</span>
                <span style={{ color: "#9b8b7c" }}>◯ Carry section boundary</span>
              </div>
            </div>

            {/* ── Elevation profile ── */}
            <div className="ufp-nobreak" style={{ marginBottom: "16px" }}>
              <div style={sectionHeadingStyle}>Elevation Profile</div>
              <div style={{ border: "1px solid #e7ddd3", borderRadius: "4px", padding: "8px 4px 4px 4px", background: "#fdf8f0" }}>
                <PrintElevationProfile output={output} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "5px", fontSize: "9px", color: "#6b5c4c" }}>
                <span style={{ color: "#b45309" }}>— Elevation</span>
                {drinkMixInPlan && <span style={{ color: "#3b82f6" }}>▬ Drink mix</span>}
                {aidStations.length > 0 && <span style={{ color: "#fb923c" }}>● Aid station</span>}
                <span style={{ color: "#f59e0b" }}>| Gel</span>
                <span style={{ color: "#10b981" }}>| Chew</span>
                {carryPlans.length > 1 && <span>--- Carry section boundary</span>}
              </div>
            </div>

            {/* ── Section overview table ── */}
            {carryPlans.length > 0 && (
              <div className="ufp-nobreak">
                <div style={sectionHeadingStyle}>Section Overview</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
                  <thead>
                    <tr style={{ background: "#f5ece3", borderBottom: "1px solid #d4b896" }}>
                      <th style={{ padding: "5px 7px", textAlign: "left", fontWeight: 700 }}>Section</th>
                      <th style={{ padding: "5px 7px", textAlign: "left", fontWeight: 700 }}>Distance</th>
                      <th style={{ padding: "5px 7px", textAlign: "left", fontWeight: 700 }}>Duration</th>
                      <th style={{ padding: "5px 7px", textAlign: "left", fontWeight: 700 }}>Elevation</th>
                      <th style={{ padding: "5px 7px", textAlign: "left", fontWeight: 700 }}>Terrain</th>
                      <th style={{ padding: "5px 7px", textAlign: "left", fontWeight: 700 }}>Fuel Strategy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carryPlans.map((plan, idx) => (
                      <tr
                        key={plan.sectionId}
                        style={{ background: idx % 2 === 0 ? "white" : "#fafaf8", borderBottom: "1px solid #ede6dd" }}
                      >
                        <td style={{ padding: "4px 7px", fontWeight: 600 }}>
                          {plan.fromLabel} → {plan.toLabel}
                        </td>
                        <td style={{ padding: "4px 7px", color: "#6b5c4c" }}>
                          {plan.fromKm.toFixed(0)}–{plan.toKm.toFixed(0)} km
                        </td>
                        <td style={{ padding: "4px 7px", color: "#6b5c4c" }}>
                          ~{formatDuration(plan.estimatedDurationMinutes)}
                        </td>
                        <td style={{ padding: "4px 7px", color: "#6b5c4c" }}>
                          {plan.ascentM > 10 ? `↑${plan.ascentM}m` : ""}
                          {plan.descentM > 10 ? ` ↓${plan.descentM}m` : ""}
                          {plan.ascentM <= 10 && plan.descentM <= 10 ? "—" : ""}
                        </td>
                        <td style={{ padding: "4px 7px", color: terrainColorPrint(plan.dominantTerrain), fontWeight: 600 }}>
                          {plan.sectionCharacter}
                        </td>
                        <td style={{ padding: "4px 7px", color: "#4a3a2a" }}>
                          {sectionStrategyLabel(plan.fromKm, plan.toKm, schedule, fuelInventory)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer — inside page 3 so it prints on the last page */}
            <RaceCardFooter />

          </div>
        )}{/* /PAGE 3 */}

        {/* Footer for no-route plans (appears on page 2) */}
        {!hasRoute && (
          <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 28px" }}>
            <RaceCardFooter />
          </div>
        )}

      </div>{/* /ufp-wrapper */}
    </>
  );
}

// ── Race card footer — branding + QR code ─────────────────────────────────────
function RaceCardFooter() {
  return (
    <div
      style={{
        marginTop: "20px",
        paddingTop: "10px",
        borderTop: "2px solid #e8d5bb",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      {/* QR code */}
      <div style={{ flexShrink: 0 }}>
        <QRCodeSVG
          value="https://ultrafuelplanner.com"
          size={56}
          bgColor="#ffffff"
          fgColor="#1a1a1a"
          level="M"
        />
      </div>

      {/* Branding text */}
      <div style={{ flex: 1, fontSize: "8px", lineHeight: "1.6", color: "#9b8b7c" }}>
        <div style={{ fontWeight: 700, fontSize: "9px", color: "#6b5c4c", letterSpacing: "0.02em" }}>
          Ultra Fuel Planner
        </div>
        <div style={{ color: "#92400e", fontWeight: 600, fontSize: "9px" }}>
          ultrafuelplanner.com
        </div>
        <div style={{ marginTop: "2px" }}>
          Generated by Ultra Fuel Planner · Upload your GPX route to build your own fuelling plan
        </div>
      </div>

      {/* Disclaimer */}
      <div
        style={{
          flexShrink: 0,
          maxWidth: "200px",
          fontSize: "8px",
          color: "#b8a898",
          lineHeight: "1.5",
          textAlign: "right",
        }}
      >
        All times are estimates.<br />
        Adjust based on real conditions on the day.<br />
        Always practise your fuelling in training.
      </div>
    </div>
  );
}

// ── SVG fallback map (shown when satellite tiles fail) ─────────────────────────
function SvgRouteFallback({ output }: { output: PlannerOutput }) {
  const route = output.eventPlan.route;
  if (!route || route.points.length === 0) return null;

  const SVG_W = 710;
  const SVG_H = 280;
  const PAD = 18;

  const pts = subsample(route.points, 600);
  const lats = pts.map((p) => p.lat);
  const lons = pts.map((p) => p.lon);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const latRange = Math.max(maxLat - minLat, 0.001);
  const lonRange = Math.max(maxLon - minLon, 0.001);
  const midLat = (minLat + maxLat) / 2;

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

  const fullPts = route.points;
  const inv = output.eventPlan.fuelInventory;

  return (
    <svg
      width={SVG_W}
      height={SVG_H}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      style={{ display: "block", border: "1px solid #e7ddd3", borderRadius: "4px" }}
    >
      <rect x={0} y={0} width={SVG_W} height={SVG_H} fill="#f0ede8" />
      <text x={SVG_W / 2} y={14} textAnchor="middle" fontSize={8} fill="#9b8b7c">
        Satellite imagery unavailable — vector route shown
      </text>

      {route.segments.map((seg: RouteSegment) => {
        const segPts = subsample(
          fullPts.filter(
            (p) => p.distanceFromStartKm >= seg.startKm && p.distanceFromStartKm <= seg.endKm,
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

      {route.segments.length === 0 && (
        <polyline
          points={pts.map((p) => proj(p.lat, p.lon).join(",")).join(" ")}
          fill="none" stroke="#d97706" strokeWidth={2.5}
        />
      )}

      {output.carryPlans.filter((c) => c.fromKm > 0).map((c) => {
        const rp = closestRoutePoint(fullPts, c.fromKm);
        const [cx, cy] = proj(rp.lat, rp.lon);
        return (
          <polygon
            key={c.sectionId}
            points={`${cx},${cy - 6} ${cx + 5},${cy} ${cx},${cy + 6} ${cx - 5},${cy}`}
            fill="#92400e" stroke="white" strokeWidth={0.8} fillOpacity={0.8}
          />
        );
      })}

      {output.schedule
        .filter((e) => e.isContinuous && inv.find((f) => f.id === e.fuelItemId)?.type === "drink_mix")
        .map((e) => {
          const rp = closestRoutePoint(fullPts, e.distanceKm);
          const [cx, cy] = proj(rp.lat, rp.lon);
          return <circle key={e.id} cx={cx} cy={cy} r={5} fill="#3b82f6" stroke="white" strokeWidth={1} fillOpacity={0.9} />;
        })}

      {output.schedule
        .filter((e) => !e.isContinuous && e.action !== "refill_at_aid" && e.action !== "restock_carry")
        .map((e) => {
          const rp = closestRoutePoint(fullPts, e.distanceKm);
          const [cx, cy] = proj(rp.lat, rp.lon);
          const item = inv.find((f) => f.id === e.fuelItemId);
          const color =
            item?.type === "gel"  ? "#f59e0b" :
            item?.type === "chew" ? "#10b981" :
            item?.type === "bar"  ? "#a78bfa" : "#9ca3af";
          return <circle key={e.id} cx={cx} cy={cy} r={2.5} fill={color} fillOpacity={0.85} />;
        })}

      {output.eventPlan.aidStations.map((aid) => {
        const rp = closestRoutePoint(fullPts, aid.distanceKm);
        const [cx, cy] = proj(rp.lat, rp.lon);
        return <circle key={aid.name} cx={cx} cy={cy} r={5} fill="#fb923c" stroke="#c2410c" strokeWidth={1.5} />;
      })}

      {(() => {
        const [sx, sy] = proj(route.points[0].lat, route.points[0].lon);
        return (
          <g>
            <circle cx={sx} cy={sy} r={8} fill="#22c55e" stroke="#15803d" strokeWidth={1.5} />
            <text x={sx} y={sy + 3.5} textAnchor="middle" fontSize={8} fill="white" fontWeight="700">S</text>
          </g>
        );
      })()}
      {(() => {
        const last = route.points[route.points.length - 1];
        const [fx, fy] = proj(last.lat, last.lon);
        return (
          <g>
            <circle cx={fx} cy={fy} r={8} fill="#ef4444" stroke="#b91c1c" strokeWidth={1.5} />
            <text x={fx} y={fy + 3.5} textAnchor="middle" fontSize={8} fill="white" fontWeight="700">F</text>
          </g>
        );
      })()}
    </svg>
  );
}

// ── Intent label helpers ───────────────────────────────────────────────────────

function printIntentLabel(intent: EventIntent | undefined): string {
  switch (intent) {
    case "training_run":      return "Training Run Plan";
    case "fuelling_practice": return "Fuelling Practice Plan";
    default:                  return "Race Day Nutrition Card";
  }
}

// ── Recovery guidance block (print) ──────────────────────────────────────────

function PrintRecoveryGuidance({
  guidance,
  sectionHeadingStyle,
}: {
  guidance: RecoveryGuidance;
  sectionHeadingStyle: React.CSSProperties;
}) {
  const windows: Array<{ label: string; text: string }> = [
    { label: "Within 30 minutes", text: guidance.immediateWindow },
    { label: "1–2 hours after",   text: guidance.twoHourWindow },
    { label: "Rest of day",       text: guidance.dayWindow },
  ];

  return (
    <div style={{ marginTop: "20px" }}>
      <div style={sectionHeadingStyle}>Post-Session Recovery</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
        {windows.map(({ label, text }) => (
          <div
            key={label}
            style={{
              border: "1px solid #bbf7d0",
              borderRadius: "6px",
              padding: "8px 10px",
              background: "#f0fdf4",
            }}
          >
            <div style={{ fontSize: "9px", fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>
              {label}
            </div>
            <div style={{ fontSize: "10px", color: "#374151", lineHeight: 1.5 }}>
              {text}
            </div>
          </div>
        ))}
      </div>
      {guidance.sodiumNote && (
        <div style={{ marginTop: "6px", fontSize: "10px", color: "#1e40af", background: "#eff6ff", borderRadius: "4px", padding: "5px 8px", border: "1px solid #bfdbfe" }}>
          💧 <strong>Electrolytes:</strong> {guidance.sodiumNote}
        </div>
      )}
    </div>
  );
}
