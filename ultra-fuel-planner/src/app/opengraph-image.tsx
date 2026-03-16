import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Ultra Fuel Planner — Terrain-aware fuelling strategy for trail and ultra runners";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          background: "#0e0b08",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Amber radial glow — top-right accent */}
        <div
          style={{
            position: "absolute",
            top: "-180px",
            right: "-80px",
            width: "580px",
            height: "580px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(245,158,11,0.20) 0%, rgba(245,158,11,0) 68%)",
            display: "flex",
          }}
        />
        {/* Subtle warm gradient at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "200px",
            background:
              "linear-gradient(to top, rgba(28,15,5,0.6) 0%, rgba(28,15,5,0) 100%)",
            display: "flex",
          }}
        />

        {/* ── Left content panel ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "68px 60px",
            width: "580px",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          {/* Logo row */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                background: "#f59e0b",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="24" height="20" viewBox="0 0 120 90" fill="white">
                <polygon points="0,90 30,8 52,42 74,20 120,90" />
              </svg>
            </div>
            <span
              style={{
                color: "#fafaf9",
                fontSize: "19px",
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              Ultra Fuel Planner
            </span>
          </div>

          {/* Main headline */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div
              style={{
                color: "#fafaf9",
                fontSize: "52px",
                fontWeight: 800,
                lineHeight: "1.06",
                letterSpacing: "-0.03em",
              }}
            >
              Plan your fuelling for the route you&apos;re running.
            </div>
            <div
              style={{
                color: "#a8a29e",
                fontSize: "20px",
                lineHeight: "1.45",
              }}
            >
              Upload your GPX. Get a terrain-aware fuelling plan with carb
              targets, carry strategy, and checkpoint guidance.
            </div>
          </div>

          {/* URL pill */}
          <div style={{ display: "flex" }}>
            <div
              style={{
                background: "rgba(245,158,11,0.18)",
                borderRadius: "100px",
                padding: "9px 20px",
                color: "#f59e0b",
                fontSize: "15px",
                fontWeight: 600,
                display: "flex",
              }}
            >
              ultrafuelplanner.com
            </div>
          </div>
        </div>

        {/* ── Right: elevation profile card ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 52px 48px 12px",
            position: "relative",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.045)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "18px",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              padding: "22px 24px 18px",
              gap: "12px",
              overflow: "hidden",
            }}
          >
            {/* Card header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  color: "#78716c",
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Elevation Profile
              </span>
              <span style={{ color: "#78716c", fontSize: "11px" }}>
                100km · 2,800m ↑
              </span>
            </div>

            {/* Elevation profile SVG */}
            <svg
              width="100%"
              height="175"
              viewBox="0 0 460 175"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="elev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.03" />
                </linearGradient>
              </defs>
              {/* Area fill */}
              <path
                d="M0,155 C18,148 32,135 52,115 C68,98 84,72 106,46 C116,32 129,26 141,44 C153,62 158,102 176,86 C191,72 201,42 216,24 C229,10 241,28 253,54 C264,76 274,118 291,102 C306,88 320,54 337,40 C350,30 360,54 372,84 C382,108 395,130 412,138 C427,144 441,141 460,140 L460,175 L0,175 Z"
                fill="url(#elev)"
              />
              {/* Route line */}
              <path
                d="M0,155 C18,148 32,135 52,115 C68,98 84,72 106,46 C116,32 129,26 141,44 C153,62 158,102 176,86 C191,72 201,42 216,24 C229,10 241,28 253,54 C264,76 274,118 291,102 C306,88 320,54 337,40 C350,30 360,54 372,84 C382,108 395,130 412,138 C427,144 441,141 460,140"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
              />
              {/* Fuel event dots */}
              <circle cx="70" cy="88" r="4.5" fill="#f97316" />
              <circle cx="130" cy="42" r="4.5" fill="#f97316" />
              <circle cx="185" cy="80" r="4.5" fill="#f97316" />
              <circle cx="240" cy="28" r="4.5" fill="#f97316" />
              <circle cx="310" cy="95" r="4.5" fill="#f97316" />
              <circle cx="360" cy="50" r="4.5" fill="#f97316" />
              <circle cx="420" cy="136" r="4.5" fill="#f97316" />
              {/* Aid station rings */}
              <circle
                cx="141"
                cy="44"
                r="7"
                fill="none"
                stroke="#fb923c"
                strokeWidth="2"
              />
              <circle
                cx="291"
                cy="102"
                r="7"
                fill="none"
                stroke="#fb923c"
                strokeWidth="2"
              />
              <circle
                cx="430"
                cy="138"
                r="7"
                fill="none"
                stroke="#fb923c"
                strokeWidth="2"
              />
              {/* Start */}
              <circle cx="4" cy="155" r="6" fill="#22c55e" />
              {/* Finish */}
              <circle cx="456" cy="140" r="6" fill="#ef4444" />
            </svg>

            {/* Stats strip — hardcoded to avoid map() issues */}
            <div
              style={{
                display: "flex",
                marginTop: "auto",
                background: "rgba(255,255,255,0.04)",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "10px 8px",
                  borderRight: "1px solid rgba(255,255,255,0.07)",
                  gap: "3px",
                }}
              >
                <span
                  style={{
                    color: "#6b7280",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.09em",
                  }}
                >
                  Carbs/hr
                </span>
                <span
                  style={{ color: "#fafaf9", fontSize: "18px", fontWeight: 700 }}
                >
                  55–70g
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "10px 8px",
                  borderRight: "1px solid rgba(255,255,255,0.07)",
                  gap: "3px",
                }}
              >
                <span
                  style={{
                    color: "#6b7280",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.09em",
                  }}
                >
                  Events
                </span>
                <span
                  style={{ color: "#fafaf9", fontSize: "18px", fontWeight: 700 }}
                >
                  22
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "10px 8px",
                  borderRight: "1px solid rgba(255,255,255,0.07)",
                  gap: "3px",
                }}
              >
                <span
                  style={{
                    color: "#6b7280",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.09em",
                  }}
                >
                  Sections
                </span>
                <span
                  style={{ color: "#fafaf9", fontSize: "18px", fontWeight: 700 }}
                >
                  7
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "10px 8px",
                  gap: "3px",
                }}
              >
                <span
                  style={{
                    color: "#6b7280",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.09em",
                  }}
                >
                  Duration
                </span>
                <span
                  style={{ color: "#fafaf9", fontSize: "18px", fontWeight: 700 }}
                >
                  ~14h
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
