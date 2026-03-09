import { NextRequest, NextResponse } from "next/server";
import { parseGPXServer } from "@/lib/gpx-parser";
import { segmentRoute } from "@/lib/segmentation";
import { DEFAULT_ASSUMPTIONS } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("gpx") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No GPX file provided." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".gpx")) {
      return NextResponse.json({ error: "File must be a .gpx file." }, { status: 400 });
    }

    const text = await file.text();

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "GPX file too large (max 5MB)." },
        { status: 400 }
      );
    }

    const route = parseGPXServer(text);

    // Generate segments immediately
    const segments = segmentRoute(route, DEFAULT_ASSUMPTIONS);
    route.segments = segments;
    route.fileName = file.name;

    return NextResponse.json({ route }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to parse GPX file.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
