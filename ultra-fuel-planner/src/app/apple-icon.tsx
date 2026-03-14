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
          // Near-black background matching the site logo
          background: "#0c0c0c",
        }}
      >
        {/*
          Double-peak M-mountain silhouette — matches the site logo.
          Left peak taller, right peak shorter, connected base.
          viewBox 0 0 120 90 → rendered at 120×90px centred in 180×180.
        */}
        <svg width="120" height="90" viewBox="0 0 120 90">
          <polygon
            points="0,90 30,8 52,42 74,20 120,90"
            fill="#f5a623"
          />
        </svg>
      </div>
    ),
    { width: 180, height: 180 }
  );
}
