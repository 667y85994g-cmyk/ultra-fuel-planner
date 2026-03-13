"use client";

import { useEffect, useState } from "react";
import { loadState } from "@/lib/storage";
import type { PlannerOutput } from "@/types";
import { formatTime, formatDuration, fuelTypeIcon } from "@/lib/utils";
import { terrainLabel } from "@/lib/segmentation";

export default function PrintPage() {
  const [output, setOutput] = useState<PlannerOutput | null>(null);

  useEffect(() => {
    const state = loadState();
    if (state.lastPlannerOutput) {
      setOutput(state.lastPlannerOutput);
    }
  }, []);

  useEffect(() => {
    if (output) {
      setTimeout(() => window.print(), 500);
    }
  }, [output]);

  if (!output) {
    return (
      <div className="p-8 text-stone-400">
        No plan found. Generate a plan first.
      </div>
    );
  }

  const { summary, schedule, carryPlans, eventPlan } = output;
  const athlete = eventPlan.athlete;
  const fuelEvents = schedule.filter(
    (e) => e.action !== "refill_at_aid" && e.action !== "restock_carry"
  );
  const aidEvents = schedule.filter((e) => e.action === "refill_at_aid");

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        color: "#1a1a1a",
        background: "white",
        padding: "24px",
        maxWidth: "800px",
        margin: "0 auto",
        fontSize: "12px",
        lineHeight: 1.5,
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "3px solid #92400e",
          paddingBottom: "16px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#1a1a1a" }}>
              {eventPlan.eventName || "Race Plan"}
            </h1>
            <p style={{ margin: "4px 0 0 0", color: "#6b5c4c" }}>
              Ultra Fuel Planner — Race Day Card
            </p>
          </div>
          <div style={{ textAlign: "right", color: "#6b5c4c", fontSize: "11px" }}>
            <div>Generated {new Date(output.generatedAt).toLocaleDateString()}</div>
            {eventPlan.route && (
              <div>{eventPlan.route.totalDistanceKm.toFixed(1)}km · ↑{Math.round(eventPlan.route.totalAscentM)}m</div>
            )}
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "24px",
          background: "#fdf4eb",
          padding: "16px",
          borderRadius: "8px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#92400e" }}>
            {formatDuration(summary.totalRaceDurationMinutes)}
          </div>
          <div style={{ fontSize: "10px", color: "#6b5c4c", textTransform: "uppercase" }}>
            Duration
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#92400e" }}>
            {summary.avgCarbsPerHour}g
          </div>
          <div style={{ fontSize: "10px", color: "#6b5c4c", textTransform: "uppercase" }}>
            Carbs/hr
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#2563eb" }}>
            {summary.hydrationGuidance
              ? `${summary.hydrationGuidance.rangeMlPerHour[0]}–${summary.hydrationGuidance.rangeMlPerHour[1]} ml/hr`
              : `~${summary.avgFluidPerHourMl}ml/hr`}
          </div>
          <div style={{ fontSize: "10px", color: "#6b5c4c", textTransform: "uppercase" }}>
            Hydration
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#16a34a" }}>
            {summary.electrolyteGuidance
              ? summary.electrolyteGuidance.tier === "high"
                ? "High support"
                : summary.electrolyteGuidance.tier === "moderate"
                ? "Moderate support"
                : "Low support"
              : "—"}
          </div>
          <div style={{ fontSize: "10px", color: "#6b5c4c", textTransform: "uppercase" }}>
            Electrolytes
          </div>
        </div>
      </div>

      {/* Timeline */}
      <h2 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", color: "#1a1a1a" }}>
        Fuelling Schedule
      </h2>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "24px",
          fontSize: "11px",
        }}
      >
        <thead>
          <tr style={{ background: "#f5ece3", borderBottom: "1px solid #d4b896" }}>
            <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600 }}>Time</th>
            <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600 }}>km</th>
            <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600 }}>Action</th>
            <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600 }}>Terrain</th>
            <th style={{ padding: "6px 8px", textAlign: "right", fontWeight: 600 }}>Carbs</th>
          </tr>
        </thead>
        <tbody>
          {schedule
            .sort((a, b) => a.timeMinutes - b.timeMinutes)
            .map((entry, i) => {
              const isAid = entry.action === "refill_at_aid";
              if (entry.isContinuous) {
                return (
                  <tr
                    key={entry.id}
                    style={{
                      background: "#f8faff",
                      borderBottom: "1px solid #dde8f8",
                      borderLeft: "3px solid #93b4e8",
                    }}
                  >
                    <td style={{ padding: "3px 8px", color: "#9ca3af", fontStyle: "italic", fontSize: "11px" }}>section</td>
                    <td style={{ padding: "3px 8px", color: "#9ca3af", fontSize: "11px" }}>{entry.distanceKm.toFixed(1)}</td>
                    <td style={{ padding: "3px 8px", color: "#4b6ea8", fontSize: "11px" }} colSpan={2}>
                      ≋ In bottle: {entry.fuelItemName ?? "Drink mix"}{entry.quantity > 1 ? ` ×${entry.quantity}` : ""} — sip steadily throughout this section
                    </td>
                    <td style={{ padding: "3px 8px", textAlign: "right", color: "#7a9bc8", fontSize: "11px" }}>
                      {entry.carbsG > 0 ? `~${entry.carbsG}g` : "—"}
                    </td>
                  </tr>
                );
              }
              return (
                <tr
                  key={entry.id}
                  style={{
                    background: isAid
                      ? "#fef3c7"
                      : i % 2 === 0
                      ? "white"
                      : "#fafaf9",
                    borderBottom: "1px solid #e7ddd3",
                  }}
                >
                  <td style={{ padding: "5px 8px", fontFamily: "monospace", color: "#92400e" }}>
                    {formatTime(entry.timeMinutes)}
                  </td>
                  <td style={{ padding: "5px 8px", color: "#6b5c4c" }}>
                    {entry.distanceKm.toFixed(1)}
                  </td>
                  <td style={{ padding: "5px 8px", fontWeight: isAid ? 600 : 400 }}>
                    {isAid ? `🏁 ${entry.fuelItemName ?? "Aid station"}` : `${entry.fuelItemName ?? entry.action} ×${entry.quantity}`}
                  </td>
                  <td style={{ padding: "5px 8px", color: "#6b5c4c" }}>
                    {terrainLabel(entry.terrain)}
                  </td>
                  <td style={{ padding: "5px 8px", textAlign: "right", color: "#92400e", fontWeight: entry.carbsG > 0 ? 600 : 400 }}>
                    {entry.carbsG > 0 ? `${entry.carbsG}g` : "—"}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      {/* Hydration reminder */}
      {summary.hydrationGuidance && (
        <div
          style={{
            marginBottom: "24px",
            padding: "10px 14px",
            background: "#eff6ff",
            borderRadius: "6px",
            border: "1px solid #bfdbfe",
            fontSize: "11px",
            color: "#1e40af",
          }}
        >
          <strong>Hydration:</strong> Aim for {summary.hydrationGuidance.rangeMlPerHour[0]}–{summary.hydrationGuidance.rangeMlPerHour[1]} ml/hr.{" "}
          {summary.hydrationGuidance.label}. Drink regularly in small sips rather than large volumes at once.
        </div>
      )}

      {/* Carry plan */}
      {carryPlans.length > 0 && (
        <>
          <h2
            style={{
              fontSize: "14px",
              fontWeight: 700,
              marginBottom: "12px",
              marginTop: "24px",
              color: "#1a1a1a",
              pageBreakBefore: "always",
            }}
          >
            Carry Plan
          </h2>
          {carryPlans.map((plan) => (
            <div
              key={plan.sectionId}
              style={{
                marginBottom: "16px",
                padding: "12px",
                background: "#f9f5f0",
                borderRadius: "6px",
                border: "1px solid #d4b896",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "6px" }}>
                {plan.fromLabel} → {plan.toLabel}
              </div>
              <div style={{ color: "#6b5c4c", fontSize: "11px", marginBottom: "8px" }}>
                km {plan.fromKm.toFixed(1)}–{plan.toKm.toFixed(1)} ·{" "}
                ~{formatDuration(plan.estimatedDurationMinutes)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <span style={{ color: "#2563eb", fontWeight: 700 }}>
                    🫙 ~{Math.round(plan.fluidToCarryMl / 500) * 0.5}L
                  </span>{" "}
                  fluid
                </div>
                <div>
                  <span style={{ color: "#92400e", fontWeight: 700 }}>
                    ⚡ {Math.round(plan.carbsToCarryG)}g
                  </span>{" "}
                  carbs
                </div>
              </div>
              {plan.itemsToCarry.length > 0 && (
                <div style={{ marginTop: "8px", fontSize: "11px" }}>
                  {plan.itemsToCarry.map((item, i) => (
                    <span key={i} style={{ marginRight: "12px", color: "#4a3a2a" }}>
                      {item.fuelItemName} ×{item.quantity}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Items needed */}
      <h2 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", marginTop: "24px" }}>
        Total Items Needed
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
        {Object.entries(summary.itemTotals)
          .sort(([, a], [, b]) => b.quantity - a.quantity)
          .map(([id, item]) => {
            const fuelItem = eventPlan.fuelInventory.find((f) => f.id === id);
            return (
              <div
                key={id}
                style={{
                  padding: "8px 12px",
                  background: "#fdf4eb",
                  borderRadius: "6px",
                  border: "1px solid #d4b896",
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  {fuelItem ? fuelTypeIcon(fuelItem.type) : "📦"} {item.name}
                </div>
                <div style={{ color: "#6b5c4c", fontSize: "11px" }}>
                  ×{item.quantity} · {Math.round(item.carbsG)}g carbs
                </div>
              </div>
            );
          })}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "32px",
          paddingTop: "12px",
          borderTop: "1px solid #d4b896",
          fontSize: "10px",
          color: "#9b8b7c",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Ultra Fuel Planner v2.18 — ultrafuelplanner.com</span>
        <span>
          All times are estimates. Adjust based on real conditions.
        </span>
      </div>
    </div>
  );
}
