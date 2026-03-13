import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // Warm dark stone gradient — Trail Hustle brand
          background: "linear-gradient(145deg, #7c2d12 0%, #3b1506 55%, #1c0a00 100%)",
        }}
      >
        <svg width="148" height="148" viewBox="0 0 148 148">
          {/* Back peak (secondary, slightly muted) */}
          <polygon
            points="96,30 130,100 62,100"
            fill="white"
            fillOpacity="0.35"
          />
          {/* Front peak (main) */}
          <polygon
            points="52,22 104,100 0,100"
            fill="white"
            fillOpacity="0.90"
          />
          {/* Snow cap — left peak */}
          <polygon
            points="52,22 68,50 36,50"
            fill="#fef3c7"
            fillOpacity="0.55"
          />
          {/* Ground base — subtle dark strip for depth */}
          <rect
            x="0"
            y="100"
            width="148"
            height="14"
            fill="#431407"
            fillOpacity="0.5"
            rx="2"
          />
          {/* Amber fuel / energy dot at front peak summit */}
          <circle cx="52" cy="23" r="10" fill="#f59e0b" />
          <circle cx="52" cy="23" r="6" fill="#fbbf24" />
          <circle cx="52" cy="23" r="3" fill="#fef9c3" />
        </svg>
      </div>
    ),
    { width: 180, height: 180 }
  );
}
