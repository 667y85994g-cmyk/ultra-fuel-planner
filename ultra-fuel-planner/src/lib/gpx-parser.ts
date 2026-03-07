import type { ParsedRoute, RoutePoint, ElevationPoint } from "@/types";

// ─── Haversine distance ───────────────────────────────────────────────────────

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Main parser ─────────────────────────────────────────────────────────────

export function parseGPX(gpxText: string): ParsedRoute {
  // Parse the XML
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxText, "text/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error("Invalid GPX file: " + parseError.textContent);
  }

  // Extract track points (try trkpt first, then wpt, then rtept)
  let trkpts = Array.from(doc.querySelectorAll("trkpt"));
  if (trkpts.length === 0) trkpts = Array.from(doc.querySelectorAll("rtept"));
  if (trkpts.length === 0) trkpts = Array.from(doc.querySelectorAll("wpt"));
  if (trkpts.length === 0) {
    throw new Error("No track points found in GPX file.");
  }

  // Build raw points
  const rawPoints: Array<{ lat: number; lon: number; ele: number }> = [];
  for (const pt of trkpts) {
    const lat = parseFloat(pt.getAttribute("lat") || "0");
    const lon = parseFloat(pt.getAttribute("lon") || "0");
    const eleEl = pt.querySelector("ele");
    const ele = eleEl ? parseFloat(eleEl.textContent || "0") : 0;
    if (!isNaN(lat) && !isNaN(lon)) {
      rawPoints.push({ lat, lon, ele });
    }
  }

  if (rawPoints.length < 2) {
    throw new Error("GPX file must contain at least 2 track points.");
  }

  // Smooth elevation with a simple moving average to reduce GPS noise
  const smoothedEle = smoothElevation(rawPoints.map((p) => p.ele), 5);

  // Build RoutePoints with cumulative distance and ascent/descent
  const points: RoutePoint[] = [];
  let cumulativeDistKm = 0;
  let cumulativeAscentM = 0;
  let cumulativeDescentM = 0;

  for (let i = 0; i < rawPoints.length; i++) {
    if (i > 0) {
      const distKm = haversineKm(
        rawPoints[i - 1].lat,
        rawPoints[i - 1].lon,
        rawPoints[i].lat,
        rawPoints[i].lon
      );
      cumulativeDistKm += distKm;

      const eleDiff = smoothedEle[i] - smoothedEle[i - 1];
      if (eleDiff > 0) cumulativeAscentM += eleDiff;
      else cumulativeDescentM += Math.abs(eleDiff);
    }

    points.push({
      lat: rawPoints[i].lat,
      lon: rawPoints[i].lon,
      elevationM: smoothedEle[i],
      distanceFromStartKm: cumulativeDistKm,
      cumulativeAscentM,
      cumulativeDescentM,
    });
  }

  const totalDistanceKm = points[points.length - 1].distanceFromStartKm;
  const elevations = points.map((p) => p.elevationM);
  const totalAscentM = points[points.length - 1].cumulativeAscentM;
  const totalDescentM = points[points.length - 1].cumulativeDescentM;

  // Build elevation profile (downsample to ~200 points for charting)
  const elevationProfile = buildElevationProfile(points, 200);

  return {
    totalDistanceKm,
    totalAscentM,
    totalDescentM,
    minElevationM: Math.min(...elevations),
    maxElevationM: Math.max(...elevations),
    points,
    segments: [], // filled by segmentation engine
    elevationProfile,
  };
}

// ─── Smoothing ────────────────────────────────────────────────────────────────

function smoothElevation(elevations: number[], windowSize: number): number[] {
  const half = Math.floor(windowSize / 2);
  return elevations.map((_, i) => {
    const start = Math.max(0, i - half);
    const end = Math.min(elevations.length - 1, i + half);
    let sum = 0;
    for (let j = start; j <= end; j++) sum += elevations[j];
    return sum / (end - start + 1);
  });
}

// ─── Elevation profile for charting ──────────────────────────────────────────

function buildElevationProfile(
  points: RoutePoint[],
  maxPoints: number
): ElevationPoint[] {
  if (points.length <= maxPoints) {
    return points.map((p, i) => ({
      distanceKm: Math.round(p.distanceFromStartKm * 10) / 10,
      elevationM: Math.round(p.elevationM),
      gradient:
        i > 0
          ? calcGradient(
              points[i - 1].distanceFromStartKm,
              points[i].distanceFromStartKm,
              points[i - 1].elevationM,
              points[i].elevationM
            )
          : 0,
    }));
  }

  const step = Math.floor(points.length / maxPoints);
  const profile: ElevationPoint[] = [];
  for (let i = 0; i < points.length; i += step) {
    const p = points[i];
    const prev = i > 0 ? points[i - step] : null;
    profile.push({
      distanceKm: Math.round(p.distanceFromStartKm * 10) / 10,
      elevationM: Math.round(p.elevationM),
      gradient: prev
        ? calcGradient(
            prev.distanceFromStartKm,
            p.distanceFromStartKm,
            prev.elevationM,
            p.elevationM
          )
        : 0,
    });
  }
  return profile;
}

function calcGradient(
  dist1: number,
  dist2: number,
  ele1: number,
  ele2: number
): number {
  const distM = (dist2 - dist1) * 1000;
  if (distM < 1) return 0;
  return Math.round(((ele2 - ele1) / distM) * 100 * 10) / 10;
}

// ─── Server-side GPX parser (no DOMParser) ───────────────────────────────────

export function parseGPXServer(gpxText: string): ParsedRoute {
  // Order-independent attribute extraction — handles lat/lon in any order
  function extractPoints(tagName: string): Array<{ lat: number; lon: number; ele: number }> {
    const blockRegex = new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, "g");
    const latRe = /lat="([^"]+)"/;
    const lonRe = /lon="([^"]+)"/;
    const eleRe = /<ele>([^<]*)<\/ele>/;
    const pts: Array<{ lat: number; lon: number; ele: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = blockRegex.exec(gpxText)) !== null) {
      const attrs = m[1];
      const inner = m[2];
      const latM = latRe.exec(attrs);
      const lonM = lonRe.exec(attrs);
      if (!latM || !lonM) continue;
      const lat = parseFloat(latM[1]);
      const lon = parseFloat(lonM[1]);
      if (isNaN(lat) || isNaN(lon)) continue;
      const eleM = eleRe.exec(inner);
      const ele = eleM ? parseFloat(eleM[1]) : 0;
      pts.push({ lat, lon, ele: isNaN(ele) ? 0 : ele });
    }
    return pts;
  }

  let rawPoints = extractPoints("trkpt");
  if (rawPoints.length === 0) rawPoints = extractPoints("rtept");
  if (rawPoints.length === 0) rawPoints = extractPoints("wpt");

  if (rawPoints.length < 2) {
    throw new Error("No track points found in GPX file.");
  }

  const smoothedEle = smoothElevation(rawPoints.map((p) => p.ele), 5);

  const points: RoutePoint[] = [];
  let cumulativeDistKm = 0;
  let cumulativeAscentM = 0;
  let cumulativeDescentM = 0;

  for (let i = 0; i < rawPoints.length; i++) {
    if (i > 0) {
      const distKm = haversineKm(
        rawPoints[i - 1].lat,
        rawPoints[i - 1].lon,
        rawPoints[i].lat,
        rawPoints[i].lon
      );
      cumulativeDistKm += distKm;

      const eleDiff = smoothedEle[i] - smoothedEle[i - 1];
      if (eleDiff > 0) cumulativeAscentM += eleDiff;
      else cumulativeDescentM += Math.abs(eleDiff);
    }

    points.push({
      lat: rawPoints[i].lat,
      lon: rawPoints[i].lon,
      elevationM: smoothedEle[i],
      distanceFromStartKm: cumulativeDistKm,
      cumulativeAscentM,
      cumulativeDescentM,
    });
  }

  const elevations = points.map((p) => p.elevationM);

  return {
    totalDistanceKm: points[points.length - 1].distanceFromStartKm,
    totalAscentM: points[points.length - 1].cumulativeAscentM,
    totalDescentM: points[points.length - 1].cumulativeDescentM,
    minElevationM: Math.min(...elevations),
    maxElevationM: Math.max(...elevations),
    points,
    segments: [],
    elevationProfile: buildElevationProfile(points, 200),
  };
}
