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
        <div className="text-4xl">🎒</div>
        <p className="text-stone-400">No carry plan generated.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-stone-50">Carry Plan</h2>
        <p className="mt-1 text-sm text-stone-400">
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
          color="text-blue-400"
        />
        <StatCard
          icon={Zap}
          label="Max carbs to carry"
          value={`${Math.round(Math.max(...carryPlans.map((p) => p.carbsToCarryG)))}g`}
          desc="Heaviest section"
          color="text-amber-400"
        />
        <StatCard
          icon={Package}
          label="Sections"
          value={String(carryPlans.length)}
          desc={`${carryPlans.filter((p) => p.warnings.length > 0).length} with warnings`}
          color="text-stone-300"
        />
      </div>

      {/* Section carry plans */}
      {carryPlans.map((plan, idx) => (
        <Card key={plan.sectionId}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm text-stone-400">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-medium text-stone-200">
                    {plan.fromLabel}
                  </span>
                  <span className="text-stone-600">→</span>
                  <span className="font-medium text-stone-200">
                    {plan.toLabel}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-stone-500">
                  km {plan.fromKm.toFixed(1)}–{plan.toKm.toFixed(1)} ·{" "}
                  ~{formatDuration(plan.estimatedDurationMinutes)}
                  {plan.ascentM > 20 && (
                    <span className="ml-1.5 text-stone-400">↑{plan.ascentM}m</span>
                  )}
                  {plan.descentM > 20 && (
                    <span className="ml-1 text-stone-500">↓{plan.descentM}m</span>
                  )}
                  {" · "}
                  <span className="text-stone-500">{plan.sectionCharacter}</span>
                </p>
              </div>
              <div className="text-right text-xs text-stone-500">
                Section {idx + 1} of {carryPlans.length}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Carry numbers */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-stone-900/60 p-4 sm:grid-cols-2">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Droplets className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-xs text-stone-500">Fluid to carry</span>
                </div>
                <p className="text-xl font-bold text-blue-400">
                  ~{Math.round(plan.fluidToCarryMl / 500) * 0.5}L
                </p>
                <p className="text-xs text-stone-600 mt-0.5">
                  {plan.fluidToCarryMl >= 1500
                    ? "Consider extra bottle"
                    : plan.fluidToCarryMl >= 1000
                    ? "Soft flask + bottle"
                    : "One soft flask"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs text-stone-500">Carbs to carry</span>
                </div>
                <p className="text-xl font-bold text-amber-400">
                  {Math.round(plan.carbsToCarryG)}g
                </p>
                <p className="text-xs text-stone-600 mt-0.5">
                  from your fuel items
                </p>
              </div>
            </div>

            {/* Items */}
            {plan.itemsToCarry.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
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
                        <span className="text-base">
                          {fuelItem ? fuelTypeIcon(fuelItem.type) : "📦"}
                        </span>
                        <span className="flex-1 text-stone-300">
                          {item.fuelItemName}
                        </span>
                        <span className="text-stone-500">×{item.quantity}</span>
                        <span className="text-amber-500 font-medium w-12 text-right">
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
              <div className="mt-4 rounded-md border border-stone-700 bg-stone-900/40 px-3 py-2 text-xs text-stone-400">
                {plan.refillInstructions}
              </div>
            )}

            {/* Warnings */}
            {plan.warnings.length > 0 && (
              <div className="mt-3 space-y-1">
                {plan.warnings.map((w, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-md bg-amber-900/20 px-3 py-2 text-xs text-amber-300"
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
          <span className="text-xs text-stone-500">{label}</span>
        </div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-stone-500 mt-1">{desc}</p>
      </CardContent>
    </Card>
  );
}
