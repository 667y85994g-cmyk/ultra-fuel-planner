"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  label: string;
  shortLabel: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, idx) => {
        const isDone = step.id < currentStep;
        const isActive = step.id === currentStep;

        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => step.id <= currentStep && onStepClick(step.id)}
              disabled={step.id > currentStep}
              className={cn(
                "flex h-7 min-w-[28px] items-center justify-center rounded-full px-2.5 text-xs font-medium transition-all",
                isDone && "bg-amber-700 text-stone-50 hover:bg-amber-600 cursor-pointer",
                isActive && "bg-amber-900 text-amber-200 ring-1 ring-amber-700",
                !isDone && !isActive && "bg-stone-800 text-stone-500 cursor-not-allowed"
              )}
            >
              {isDone ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="hidden sm:inline">{step.shortLabel}</span>
              )}
              <span className="sm:hidden">{step.id + 1}</span>
            </button>

            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-px w-6 transition-colors",
                  step.id < currentStep ? "bg-amber-700" : "bg-stone-700"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
