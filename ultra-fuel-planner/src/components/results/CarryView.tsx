"use client";

import type { PlannerOutput, CarryPlan } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration, fuelTypeIcon } from "@/lib/utils";
import { Droplets, Zap, MapPin, AlertTriangle, Package } from "lucide-react";

interface Props {
  output: PlannerOutput;
}

export function CarryView({ output }: Props) {
  const { carryPlans } = output;

  if (carryPlans.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Package className="h-10 w-10 text-ink-4 mx-auto" />
        <p className="text-ink-3">No carry plan generated.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-ink">Carry Plan</h2>
        <p className="mt-1 text-sm text-ink-3">
          What to carry between each checkpoint. Based on your fluid and carb
          targets for each section.
        </p>
      </div>

      {/* Overview */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={Droplets}
          label="Max fluid to carry"
          value={`~${Math.round(Math.max(...carryPlans.map((p) => p.fluidToCarryMl)) / 500) * 0.5}L`}
          desc="Heaviest section (approx.)"
          color="text-ufp-slate"
        />
        <StatCard
          icon={Zap}
          label="Max carbs to carry"
          value={`${Math.round(Math.max(...carryPlans.map((p) => p.carbsToCarryG)))}g`}
          desc="Heaviest section"
          color="text-ochre"
        />
        <StatCard
          icon={Package}
          label="Sections"
          value={String(carryPlans.length)}
          desc={`${carryPlans.filter((p) => p.warnings.length > 0).length} with warnings`}
          color="text-ink-2"
        />
      </div>

      {/* Section carry plans */}
      {carryPlans.map((plan, idx) => (
        <Card key={plan.sectionId}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm text-ink-3">
                  <MapPin className="h-3.5 w-3.5 text-ochre" />
                  <span className="font-medium text-ink-2">
                    {plan.fromLabel}
                  </span>
                  <span className="text-ink-3">→</span>
                  <span className="font-medium text-ink-2">
                    {plan.toLabel}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-ink-3">
                  km {plan.fromKm.toFixed(1)}–{plan.toKm.toFixed(1)} ·{" "}
                  ~{formatDuration(plan.estimatedDurationMinutes)}
                  {plan.ascentM > 20 && (
                    <span className="ml-1.5 text-ink-3">↑{plan.ascentM}m</span>
                  )}
                  {plan.descentM > 20 && (
                    <span className="ml-1 text-ink-3">↓{plan.descentM}m</span>
                  )}
                  {" · "}
                  <span className="text-ink-3">{plan.sectionCharacter}</span>
                </p>
              </div>
              <div className="text-right text-xs text-ink-3">
                Section {idx + 1} of {carryPlans.length}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Carry numbers */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-paper/60 p-4 sm:grid-cols-2">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Droplets className="h-3.5 w-3.5 text-ufp-slate" />
                  <span className="text-xs text-ink-3">Fluid to carry</span>
                </div>
                <p className="text-xl font-bold text-ufp-slate">
                  ~{Math.round(plan.fluidToCarryMl / 500) * 0.5}L
                </p>
                <p className="text-xs text-ink-3 mt-0.5">
                  {plan.fluidToCarryMl >= 1500
                    ? "Consider extra bottle"
                    : plan.fluidToCarryMl >= 1000
                    ? "Soft flask + bottle"
                    : "One soft flask"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="h-3.5 w-3.5 text-ochre" />
                  <span className="text-xs text-ink-3">Carbs to carry</span>
                </div>
                <p className="text-xl font-bold text-ochre">
                  {Math.round(plan.carbsToCarryG)}g
                </p>
                <p className="text-xs text-ink-3 mt-0.5">
                  from your fuel items
                </p>
              </div>
            </div>

            {/* Items */}
            {plan.itemsToCarry.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-2">
                  Items
                </p>
                <div className="space-y-1.5">
                  {plan.itemsToCarry.map((item, i) => {
                    const fuelItem = output.eventPlan.fuelInventory.find(
                      (f) => f.id === item.fuelItemId
                    );
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="inline-flex items-center justify-center w-7 h-5 rounded text-[10px] font-mono text-ink-3 bg-paper-2 shrink-0">
                          {fuelItem ? fuelTypeIcon(fuelItem.type) : "—"}
                        </span>
                        <span className="flex-1 text-ink-2">
                          {item.fuelItemName}
                        </span>
                        <span className="text-ink-3">×{item.quantity}</span>
                        <span className="text-ochre font-medium w-12 text-right">
                          {Math.round(item.carbsG)}g
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Refill note */}
            {plan.refillInstructions && (
              <div className="mt-4 rounded-md border border-rule bg-paper/40 px-3 py-2 text-xs text-ink-3">
                {plan.refillInstructions}
              </div>
            )}

            {/* Warnings */}
            {plan.warnings.length > 0 && (
              <div className="mt-3 space-y-1">
                {plan.warnings.map((w, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-md bg-ochre-hover/20 px-3 py-2 text-xs text-ochre"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    {w}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  desc,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  desc: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`h-4 w-4 ${color}`} />
          <span className="text-xs text-ink-3">{label}</span>
        </div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-ink-3 mt-1">{desc}</p>
      </CardContent>
    </Card>
  );
}
