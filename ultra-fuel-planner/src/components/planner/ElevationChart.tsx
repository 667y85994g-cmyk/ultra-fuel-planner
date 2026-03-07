"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { ElevationPoint, RouteSegment } from "@/types";
import { terrainColor } from "@/lib/utils";

interface Props {
  data: ElevationPoint[];
  segments?: RouteSegment[];
  height?: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ElevationPoint }>;
  label?: number;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-xs shadow-lg">
      <p className="text-stone-400">
        km {d.distanceKm.toFixed(1)}
      </p>
      <p className="font-semibold text-stone-100">
        {Math.round(d.elevationM)}m
      </p>
      {d.gradient !== undefined && (
        <p className={`text-xs ${d.gradient > 10 ? "text-orange-400" : d.gradient < -10 ? "text-blue-400" : "text-stone-400"}`}>
          {d.gradient > 0 ? "+" : ""}{d.gradient.toFixed(1)}%
        </p>
      )}
    </div>
  );
}

export function ElevationChart({ data, segments = [], height = 200 }: Props) {
  if (!data || data.length === 0) return null;

  const minEle = Math.min(...data.map((d) => d.elevationM));
  const maxEle = Math.max(...data.map((d) => d.elevationM));
  const padding = Math.max(20, (maxEle - minEle) * 0.1);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#92400e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#92400e" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />

          <XAxis
            dataKey="distanceKm"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#78716c", fontSize: 11 }}
            tickFormatter={(v) => `${v}km`}
            interval="preserveStartEnd"
          />

          <YAxis
            domain={[minEle - padding, maxEle + padding]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#78716c", fontSize: 11 }}
            tickFormatter={(v) => `${Math.round(v)}m`}
            width={50}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Segment reference lines */}
          {segments.map((seg) => (
            <ReferenceLine
              key={seg.id}
              x={seg.startKm}
              stroke={terrainColor(seg.terrain)}
              strokeOpacity={0.4}
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          ))}

          <Area
            type="monotone"
            dataKey="elevationM"
            stroke="#b45309"
            strokeWidth={2}
            fill="url(#elevGrad)"
            dot={false}
            activeDot={{ r: 3, fill: "#f59e0b" }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Terrain legend */}
      {segments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 px-2">
          {Array.from(new Set(segments.map((s) => s.terrain))).map((terrain) => (
            <div key={terrain} className="flex items-center gap-1.5">
              <div
                className="h-2 w-3 rounded-sm"
                style={{ backgroundColor: terrainColor(terrain) }}
              />
              <span className="text-xs text-stone-500 capitalize">
                {terrain.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
