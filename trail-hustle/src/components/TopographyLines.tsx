"use client";

import React, { useMemo } from "react";

interface TopographyLinesProps {
  className?: string;
  color?: string;
  opacity?: number;
  lineCount?: number;
}

function generateContourPath(
  y: number,
  width: number,
  seed: number
): string {
  const points: string[] = [];
  const step = 30;
  points.push(`M -20 ${y}`);

  for (let x = 0; x <= width + 20; x += step) {
    // Create organic waviness using multiple sine waves
    const v1 = Math.sin((x * 0.012) + seed) * 12;
    const v2 = Math.cos((x * 0.006) + seed * 1.3) * 7;
    const v3 = Math.sin((x * 0.025) + seed * 0.7) * 4;
    const variance = v1 + v2 + v3;
    points.push(`L ${x} ${y + variance}`);
  }

  return points.join(" ");
}

export default function TopographyLines({
  className = "",
  color = "currentColor",
  opacity = 0.08,
  lineCount = 18,
}: TopographyLinesProps) {
  const paths = useMemo(() => {
    const width = 1440;
    const height = 800;
    const spacing = height / (lineCount + 1);
    return Array.from({ length: lineCount }, (_, i) => ({
      id: i,
      d: generateContourPath(
        spacing * (i + 1),
        width,
        i * 2.1 + 0.5
      ),
    }));
  }, [lineCount]);

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      viewBox="0 0 1440 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {paths.map((p) => (
        <path
          key={p.id}
          d={p.d}
          stroke={color}
          strokeWidth="1"
          fill="none"
          opacity={opacity}
        />
      ))}
    </svg>
  );
}
