import type {
  ParsedRoute,
  RoutePoint,
  RouteSegment,
  TerrainType,
  PlannerAssumptions,
} from "@/types";

// ─── Gradient thresholds ──────────────────────────────────────────────────────

const THRESHOLDS = {
  FLAT_MAX_PCT: 3,          // ±3% is flat
  ROLLING_MAX_PCT: 8,       // 3–8% is rolling
  CLIMB_SUSTAINED_PCT: 8,   // 8%+ and >500m sustained = sustained climb
  STEEP_CLIMB_PCT: 15,      // 15%+ = steep climb
  DESCENT_RUNNABLE_PCT: -8, // 0 to -8% = runnable descent
  DESCENT_TECHNICAL_PCT: -15, // steeper than -15% = technical
  MIN_SEGMENT_KM: 1.0,      // minimum segment length before merging
  MERGE_SAME_TERRAIN_KM: 0.5, // merge short same-terrain segments
};

// ─── Pace estimates ───────────────────────────────────────────────────────────

function estimatePaceMinPerKm(
  terrain: TerrainType,
  avgGradientPct: number,
  assumptions: PlannerAssumptions
): number {
  const base = assumptions.paceFlatMinPerKm;

  switch (terrain) {
    case "flat_runnable":
      return base;
    case "rolling":
      return base * 1.1;
    case "sustained_climb": {
      // Naismith's rule: +1min per 100m gain per km
      const gainPer100m = Math.max(0, avgGradientPct / 100) * 10; // 100m per km at this gradient
      return base + gainPer100m * assumptions.paceClimbMinPerKmPer100mGain;
    }
    case "steep_climb": {
      const gainPer100m = Math.max(0, avgGradientPct / 100) * 10;
      return base + gainPer100m * assumptions.paceClimbMinPerKmPer100mGain * 1.3;
    }
    case "runnable_descent":
      return base * assumptions.paceDescentFactor;
    case "technical_descent":
      return base * 1.2; // slower than flat due to care required
    case "recovery":
      return base * 0.95;
    default:
      return base;
  }
}

function effortLevel(terrain: TerrainType): 1 | 2 | 3 | 4 | 5 {
  switch (terrain) {
    case "steep_climb": return 5;
    case "sustained_climb": return 4;
    case "rolling": return 3;
    case "flat_runnable": return 3;
    case "runnable_descent": return 2;
    case "technical_descent": return 3; // effort from concentration/braking
    case "recovery": return 1;
    default: return 3;
  }
}

// ─── Classify a stretch of route ─────────────────────────────────────────────

function classifyTerrain(avgGradientPct: number, _ascentM: number): TerrainType {
  if (avgGradientPct >= THRESHOLDS.STEEP_CLIMB_PCT) return "steep_climb";
  if (avgGradientPct >= THRESHOLDS.CLIMB_SUSTAINED_PCT) return "sustained_climb";
  if (avgGradientPct >= THRESHOLDS.ROLLING_MAX_PCT) return "sustained_climb";
  if (avgGradientPct > THRESHOLDS.FLAT_MAX_PCT) return "rolling";
  if (avgGradientPct >= -THRESHOLDS.FLAT_MAX_PCT) return "flat_runnable";
  if (avgGradientPct >= THRESHOLDS.DESCENT_RUNNABLE_PCT) return "rolling"; // slight downhill = rolling
  if (avgGradientPct >= THRESHOLDS.DESCENT_TECHNICAL_PCT) return "runnable_descent";
  return "technical_descent";
}

function terrainLabel(terrain: TerrainType): string {
  const labels: Record<TerrainType, string> = {
    flat_runnable: "Flat / Runnable",
    rolling: "Rolling",
    sustained_climb: "Sustained Climb",
    steep_climb: "Steep Climb",
    runnable_descent: "Runnable Descent",
    technical_descent: "Technical Descent",
    recovery: "Recovery / Easy",
  };
  return labels[terrain] ?? terrain;
}

// ─── Main segmentation function ───────────────────────────────────────────────

export function segmentRoute(
  route: ParsedRoute,
  assumptions: PlannerAssumptions,
  segmentLengthKm = 2.0
): RouteSegment[] {
  const { points } = route;
  if (points.length < 2) return [];

  // Step 1: Create raw mini-segments of ~segmentLengthKm
  const rawSegments = buildRawSegments(points, segmentLengthKm);

  // Step 2: Merge adjacent same-terrain segments up to a max length
  const merged = mergeSegments(rawSegments, 8.0);

  // Step 3: Build final RouteSegment objects with pace/effort/labels
  const segments: RouteSegment[] = merged.map((raw, idx) => {
    const distKm = raw.endKm - raw.startKm;
    const ascentM = raw.ascentM;
    const descentM = raw.descentM;
    const avgGradPct =
      distKm > 0 ? ((ascentM - descentM) / (distKm * 1000)) * 100 : 0;

    const terrain = classifyTerrain(avgGradPct, ascentM);
    const pace = estimatePaceMinPerKm(terrain, avgGradPct, assumptions);
    const durationMins = Math.round(distKm * pace);

    return {
      id: `seg-${idx + 1}`,
      name: `${terrainLabel(terrain)} (km ${raw.startKm.toFixed(1)}–${raw.endKm.toFixed(1)})`,
      startKm: raw.startKm,
      endKm: raw.endKm,
      distanceKm: distKm,
      startElevationM: raw.startEle,
      endElevationM: raw.endEle,
      ascentM: Math.round(ascentM),
      descentM: Math.round(descentM),
      avgGradientPct: Math.round(avgGradPct * 10) / 10,
      maxGradientPct: Math.round(raw.maxGradPct * 10) / 10,
      terrain,
      estimatedDurationMinutes: durationMins,
      estimatedPaceMinPerKm: Math.round(pace * 10) / 10,
      effortLevel: effortLevel(terrain),
      notes: undefined,
    };
  });

  return segments;
}

// ─── Build raw mini-segments ──────────────────────────────────────────────────

interface RawSeg {
  startKm: number;
  endKm: number;
  startEle: number;
  endEle: number;
  ascentM: number;
  descentM: number;
  maxGradPct: number;
  terrain: TerrainType;
}

function buildRawSegments(points: RoutePoint[], targetKm: number): RawSeg[] {
  const segments: RawSeg[] = [];
  let segStart = 0;

  while (segStart < points.length - 1) {
    let segEnd = segStart + 1;
    const startKm = points[segStart].distanceFromStartKm;
    const startEle = points[segStart].elevationM;

    let ascentM = 0;
    let descentM = 0;
    let maxGradPct = 0;

    // Accumulate until we hit targetKm or end of route
    while (segEnd < points.length) {
      const distKm = points[segEnd].distanceFromStartKm - startKm;
      const eleDiff = points[segEnd].elevationM - points[segEnd - 1].elevationM;
      const segDistM =
        (points[segEnd].distanceFromStartKm -
          points[segEnd - 1].distanceFromStartKm) *
        1000;
      const gradPct = segDistM > 0 ? (eleDiff / segDistM) * 100 : 0;

      if (eleDiff > 0) ascentM += eleDiff;
      else descentM += Math.abs(eleDiff);

      if (Math.abs(gradPct) > Math.abs(maxGradPct)) maxGradPct = gradPct;

      if (distKm >= targetKm || segEnd === points.length - 1) {
        const endKm = points[segEnd].distanceFromStartKm;
        const endEle = points[segEnd].elevationM;
        const netGrad =
          distKm > 0 ? ((ascentM - descentM) / (distKm * 1000)) * 100 : 0;

        segments.push({
          startKm,
          endKm,
          startEle,
          endEle,
          ascentM,
          descentM,
          maxGradPct,
          terrain: classifyTerrain(netGrad, ascentM),
        });

        segStart = segEnd;
        break;
      }
      segEnd++;
    }

    if (segEnd >= points.length) break;
  }

  return segments;
}

// ─── Merge adjacent same-terrain segments ────────────────────────────────────

function mergeSegments(raws: RawSeg[], maxMergedKm: number): RawSeg[] {
  if (raws.length === 0) return [];

  const merged: RawSeg[] = [{ ...raws[0] }];

  for (let i = 1; i < raws.length; i++) {
    const last = merged[merged.length - 1];
    const cur = raws[i];
    const mergedLen = cur.endKm - last.startKm;

    if (cur.terrain === last.terrain && mergedLen <= maxMergedKm) {
      // Merge
      last.endKm = cur.endKm;
      last.endEle = cur.endEle;
      last.ascentM += cur.ascentM;
      last.descentM += cur.descentM;
      if (Math.abs(cur.maxGradPct) > Math.abs(last.maxGradPct)) {
        last.maxGradPct = cur.maxGradPct;
      }
    } else {
      merged.push({ ...cur });
    }
  }

  return merged;
}

// ─── Get segment at distance ──────────────────────────────────────────────────

export function getSegmentAtKm(
  segments: RouteSegment[],
  km: number
): RouteSegment | undefined {
  return segments.find((s) => km >= s.startKm && km <= s.endKm);
}

// ─── Get cumulative time to a distance ───────────────────────────────────────

export function getCumulativeTimeMinutes(
  segments: RouteSegment[],
  targetKm: number
): number {
  let totalMins = 0;
  for (const seg of segments) {
    if (seg.endKm <= targetKm) {
      totalMins += seg.estimatedDurationMinutes;
    } else if (seg.startKm < targetKm) {
      const fraction = (targetKm - seg.startKm) / seg.distanceKm;
      totalMins += seg.estimatedDurationMinutes * fraction;
      break;
    }
  }
  return Math.round(totalMins);
}

export { terrainLabel };
