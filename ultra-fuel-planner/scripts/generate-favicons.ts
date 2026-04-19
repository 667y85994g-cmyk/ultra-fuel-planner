/**
 * generate-favicons.ts
 *
 * Rasters brand SVG sources in assets/brand/favicon/ into static PNG files
 * in public/ and assembles a multi-resolution favicon.ico.
 *
 * Run:  npm run build:favicons
 *
 * Re-run whenever files in assets/brand/favicon/ change. The generated
 * PNGs are committed to the repo so CI doesn't need sharp at build time.
 *
 * Requires: sharp (already in node_modules)
 */

import path from "path";
import fs from "fs";
import sharp from "sharp";

const ROOT = path.resolve(__dirname, "..");
const FAVICON_SRC = path.join(ROOT, "assets/brand/favicon");
const PUBLIC = path.join(ROOT, "public");

// ---------------------------------------------------------------------------
// PNG outputs
// ---------------------------------------------------------------------------

interface PngTask {
  src: string;   // filename inside FAVICON_SRC
  dest: string;  // filename inside PUBLIC
  size: number;
}

const PNG_TASKS: PngTask[] = [
  { src: "favicon-16.svg",       dest: "favicon-16.png",          size: 16  },
  { src: "favicon-32.svg",       dest: "favicon-32.png",          size: 32  },
  { src: "favicon-64.svg",       dest: "favicon-64.png",          size: 64  },
  { src: "favicon-128.svg",      dest: "favicon-128.png",         size: 128 },
  { src: "apple-touch-icon.svg", dest: "apple-touch-icon.png",    size: 180 },
  { src: "apple-touch-icon.svg", dest: "android-chrome-192.png",  size: 192 },
  { src: "apple-touch-icon.svg", dest: "android-chrome-512.png",  size: 512 },
];

// ---------------------------------------------------------------------------
// ICO helper — wraps one or more PNGs into a valid .ico binary
// ---------------------------------------------------------------------------

function buildIco(pngs: Buffer[], sizes: number[]): Buffer {
  const count = pngs.length;
  const HEADER_SIZE = 6;
  const DIR_ENTRY_SIZE = 16;

  const offsets: number[] = [];
  let offset = HEADER_SIZE + count * DIR_ENTRY_SIZE;
  for (const png of pngs) {
    offsets.push(offset);
    offset += png.length;
  }

  const buf = Buffer.alloc(offset);
  let pos = 0;

  // ICO header
  buf.writeUInt16LE(0, pos); pos += 2;      // Reserved (must be 0)
  buf.writeUInt16LE(1, pos); pos += 2;      // Type: 1 = ICO
  buf.writeUInt16LE(count, pos); pos += 2;  // Number of images

  // Directory entries
  for (let i = 0; i < count; i++) {
    const sz = sizes[i];
    buf.writeUInt8(sz >= 256 ? 0 : sz, pos); pos += 1;  // Width  (0 = 256)
    buf.writeUInt8(sz >= 256 ? 0 : sz, pos); pos += 1;  // Height (0 = 256)
    buf.writeUInt8(0, pos); pos += 1;   // Colour count (0 = no palette)
    buf.writeUInt8(0, pos); pos += 1;   // Reserved
    buf.writeUInt16LE(1, pos);  pos += 2;   // Colour planes
    buf.writeUInt16LE(32, pos); pos += 2;   // Bits per pixel
    buf.writeUInt32LE(pngs[i].length, pos); pos += 4;  // Image data size
    buf.writeUInt32LE(offsets[i], pos);     pos += 4;  // Image data offset
  }

  // Append each PNG
  for (const png of pngs) {
    png.copy(buf, pos);
    pos += png.length;
  }

  return buf;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  fs.mkdirSync(PUBLIC, { recursive: true });

  // 1. PNG rasters
  for (const task of PNG_TASKS) {
    const src = path.join(FAVICON_SRC, task.src);
    const dest = path.join(PUBLIC, task.dest);
    await sharp(src)
      .resize(task.size, task.size)
      .png()
      .toFile(dest);
    console.log(`✓  ${task.dest.padEnd(30)} ${task.size}×${task.size}`);
  }

  // 2. favicon.ico — 16, 32, 48px embedded PNGs
  const icoSources: Array<{ src: string; size: number }> = [
    { src: "favicon-16.svg", size: 16 },
    { src: "favicon-32.svg", size: 32 },
    { src: "favicon-32.svg", size: 48 },  // 48px from the 32 source
  ];

  const icoPngs: Buffer[] = [];
  const icoSizes: number[] = [];
  for (const { src, size } of icoSources) {
    const buf = await sharp(path.join(FAVICON_SRC, src))
      .resize(size, size)
      .png()
      .toBuffer();
    icoPngs.push(buf);
    icoSizes.push(size);
  }

  const ico = buildIco(icoPngs, icoSizes);
  fs.writeFileSync(path.join(PUBLIC, "favicon.ico"), ico);
  console.log(`✓  ${"favicon.ico".padEnd(30)} 16×16, 32×32, 48×48`);

  console.log("\nDone. Commit the files in public/ to skip sharp at CI time.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
