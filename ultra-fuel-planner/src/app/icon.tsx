import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c0c0c",
          borderRadius: 36,
        }}
      >
        {/* Double-peak M-mountain — matches site logo, scaled to 192×192 */}
        <svg width="132" height="99" viewBox="0 0 120 90">
          <polygon
            points="0,90 30,8 52,42 74,20 120,90"
            fill="#f5a623"
          />
        </svg>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
