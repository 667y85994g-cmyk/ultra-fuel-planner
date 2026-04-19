"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlanner } from "@/lib/planner-store";
import { SavedPlansMenu } from "@/components/planner/SavedPlansMenu";

const STEPS = [
  { id: 0, label: "Athlete", shortLabel: "You" },
  { id: 1, label: "Calibration", shortLabel: "Data" },
  { id: 2, label: "Route", shortLabel: "Route" },
  { id: 3, label: "Fuel", shortLabel: "Fuel" },
  { id: 4, label: "Aid Stations", shortLabel: "Aid" },
  { id: 5, label: "Generate", shortLabel: "Plan" },
];

export function PlannerStepBar() {
  const { state, dispatch } = usePlanner();
  const currentStep = state.currentStep;

  const goToStep = (step: number) => {
    if (step <= currentStep) dispatch({ type: "SET_STEP", step });
  };

  return (
    <div className="border-b border-rule bg-paper">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3 gap-4">
        {/* Step pills */}
        <div className="flex items-center gap-1">
          {STEPS.map((step, idx) => {
            const isDone = step.id < currentStep;
            const isActive = step.id === currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => goToStep(step.id)}
                  disabled={step.id > currentStep}
                  className={cn(
                    "flex h-7 min-w-[28px] items-center justify-center rounded px-2.5 transition-colors duration-150",
                    "text-xs font-mono",
                    isDone && "bg-ochre/15 text-ochre cursor-pointer hover:bg-ochre/25",
                    isActive && "bg-paper-3 text-ink border border-rule font-medium",
                    !isDone && !isActive && "text-ink-3 cursor-not-allowed"
                  )}
                  title={step.label}
                >
                  {isDone ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <>
                      <span className="hidden sm:inline">{step.shortLabel}</span>
                      <span className="sm:hidden">{step.id + 1}</span>
                    </>
                  )}
                </button>

                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "mx-1 h-px w-4 transition-colors duration-150",
                      step.id < currentStep ? "bg-ochre/40" : "bg-rule"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Right: saved plans */}
        <SavedPlansMenu />
      </div>
    </div>
  );
}
