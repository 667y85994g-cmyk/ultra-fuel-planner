import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #7c2d12 0%, #431407 100%)",
          borderRadius: 6,
        }}
      >
        {/* Mountain peak — simple triangle */}
        <svg width="28" height="28" viewBox="0 0 28 28">
          {/* Main peak */}
          <polygon
            points="14,4 24,22 4,22"
            fill="white"
            fillOpacity="0.92"
          />
          {/* Snow cap highlight */}
          <polygon
            points="14,4 18,11 10,11"
            fill="#fef3c7"
            fillOpacity="0.6"
          />
          {/* Amber fuel dot at summit */}
          <circle cx="14" cy="5.5" r="2.5" fill="#f59e0b" />
        </svg>
      </div>
    ),
    { width: 32, height: 32 }
  );
}
