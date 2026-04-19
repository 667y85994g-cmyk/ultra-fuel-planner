/**
 * generate-wordmark-paths.ts
 *
 * Generates outlined SVG path data for every wordmark variant from the
 * Instrument Serif font.  Run once; commit the output JSON.  Regenerate
 * only when text or sizing changes.
 *
 *   npm run build:wordmark
 *
 * Path coordinate system
 * ─────────────────────
 * We call font.getPath(text, 0, fontSize, fontSize, opts) so that:
 *   • x origin = 0 (left edge of first glyph advance, minus any left bearing)
 *   • baseline = y = fontSize
 *   • ascenders sit above baseline (y < fontSize)
 *   • descenders sit below (y > fontSize)
 *
 * To embed in an SVG at a target baseline position (bx, by):
 *   transform="translate(bx - bbox.x1, by - fontSize)"
 *
 * For centered text (text-anchor="middle" equivalent):
 *   cx = svgCenterX
 *   translateX = cx - (bbox.x1 + (bbox.x2 - bbox.x1) / 2)
 *   translateY = by - fontSize
 *
 * letterSpacing
 * ─────────────
 * opentype.js accepts letterSpacing in em units (1 em = fontSize px).
 * To convert SVG letter-spacing (px) to em: divide by fontSize.
 *
 * Output
 * ──────
 * scripts/wordmark-paths.json — path data + bbox for each variant.
 */

import { loadSync } from "opentype.js";
import { writeFileSync } from "fs";
import { resolve } from "path";

const FONT_PATH = resolve("public/fonts/InstrumentSerif-Regular.ttf");

interface PathConfig {
  name: string;
  text: string;
  fontSize: number;
  /** SVG letter-spacing in px (will be divided by fontSize to get em) */
  letterSpacingPx: number;
}

/** Matches the text content and sizes used in each lockup SVG exactly. */
const CONFIGS: PathConfig[] = [
  // nav.svg — fontSize=24, letter-spacing=1, single line
  { name: "nav", text: "Ultra Fuel Planner", fontSize: 24, letterSpacingPx: 1 },

  // compact.svg — fontSize=28, letter-spacing=2, two lines
  { name: "compact-line1", text: "Ultra Fuel", fontSize: 28, letterSpacingPx: 2 },
  { name: "compact-line2", text: "Planner", fontSize: 28, letterSpacingPx: 2 },

  // stacked.svg — fontSize=30, letter-spacing=3, single centered line
  { name: "stacked", text: "Ultra Fuel Planner", fontSize: 30, letterSpacingPx: 3 },

  // primary.svg — fontSize=34, letter-spacing=5.5, uppercase centered
  { name: "primary", text: "ULTRA FUEL PLANNER", fontSize: 34, letterSpacingPx: 5.5 },

  // wordmark.svg — fontSize=30, letter-spacing=3, uppercase left-aligned
  { name: "wordmark", text: "ULTRA FUEL PLANNER", fontSize: 30, letterSpacingPx: 3 },
];

interface PathEntry {
  d: string;
  bbox: { x1: number; y1: number; x2: number; y2: number };
  /** Rendered width in px (x2 - x1, rounded up) */
  width: number;
  /** Rendered height in px (y2 - y1, rounded up) */
  height: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function main() {
  const font = loadSync(FONT_PATH);
  const out: Record<string, PathEntry> = {};

  for (const { name, text, fontSize, letterSpacingPx } of CONFIGS) {
    const letterSpacingEm = letterSpacingPx / fontSize;
    // Baseline at y=fontSize so all coordinates are positive
    const path = font.getPath(text, 0, fontSize, fontSize, {
      letterSpacing: letterSpacingEm,
    });
    const raw = path.getBoundingBox();
    const bbox = {
      x1: round2(raw.x1),
      y1: round2(raw.y1),
      x2: round2(raw.x2),
      y2: round2(raw.y2),
    };
    out[name] = {
      d: path.toPathData(2),
      bbox,
      width: Math.ceil(raw.x2 - raw.x1),
      height: Math.ceil(raw.y2 - raw.y1),
    };
  }

  const outputPath = "scripts/wordmark-paths.json";
  writeFileSync(outputPath, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${outputPath}\n`);

  // Print embedding reference
  console.log("Embedding reference");
  console.log("===================");
  for (const [name, { bbox, width, height }] of Object.entries(out)) {
    const cfg = CONFIGS.find((c) => c.name === name)!;
    const { fontSize } = cfg;
    console.log(`\n${name} (fontSize=${fontSize})`);
    console.log(`  bbox  : x1=${bbox.x1}  y1=${bbox.y1}  x2=${bbox.x2}  y2=${bbox.y2}`);
    console.log(`  size  : ${width} × ${height} px`);
    console.log(
      `  embed : translate(x_target - ${bbox.x1}, y_baseline - ${fontSize})`
    );
    console.log(
      `  center: translateX = svgCenterX - ${round2(bbox.x1 + width / 2)}, translateY = y_baseline - ${fontSize}`
    );
  }
}

main();
