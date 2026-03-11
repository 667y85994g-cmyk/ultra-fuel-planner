"use client";

import { useRouter } from "next/navigation";
import { Mountain } from "lucide-react";
import { usePlanner } from "@/lib/planner-store";
import { StepIndicator } from "@/components/planner/StepIndicator";
import { StepAthlete } from "@/components/planner/StepAthlete";
import { StepCalibration } from "@/components/planner/StepCalibration";
import { StepRoute } from "@/components/planner/StepRoute";
import { StepFuel } from "@/components/planner/StepFuel";
import { StepAidStations } from "@/components/planner/StepAidStations";
import { StepGenerate } from "@/components/planner/StepGenerate";
import Link from "next/link";
import { LegalFooter } from "@/components/LegalFooter";

const STEPS = [
  { id: 0, label: "Athlete", shortLabel: "You" },
  { id: 1, label: "Calibration", shortLabel: "Data" },
  { id: 2, label: "Route", shortLabel: "Route" },
  { id: 3, label: "Fuel", shortLabel: "Fuel" },
  { id: 4, label: "Aid Stations", shortLabel: "Aid" },
  { id: 5, label: "Generate", shortLabel: "Plan" },
];

export default function PlannerPage() {
  const router = useRouter();
  const { state, dispatch, runPlanner } = usePlanner();
  const currentStep = state.currentStep;

  const goToStep = (step: number) => {
    dispatch({ type: "SET_STEP", step });
  };

  const handleGenerate = () => {
    dispatch({ type: "SET_GENERATING", value: true });
    // Small delay to allow UI to update
    setTimeout(() => {
      runPlanner();
      dispatch({ type: "SET_GENERATING", value: false });
      router.push("/results");
    }, 300);
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      {/* Top nav */}
      <nav className="sticky top-0 z-50 border-b border-stone-800/60 bg-stone-950/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-stone-400 hover:text-stone-200 transition-colors">
            <Mountain className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Ultra Fuel Planner</span>
            <span className="text-[10px] text-stone-600">v2.15</span>
          </Link>

          <StepIndicator steps={STEPS} currentStep={currentStep} onStepClick={goToStep} />

          <div className="flex items-center gap-2 text-sm text-stone-500">
            <span>Step {currentStep + 1} of {STEPS.length}</span>
          </div>
        </div>
      </nav>

      {/* Beta notice */}
      <div className="border-b border-amber-800/20 bg-amber-900/10">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-2">
          <span className="flex-shrink-0 rounded bg-amber-800/40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400">
            Beta
          </span>
          <p className="text-xs text-stone-400">
            Currently in beta. Plans should be tested in training before race day.
          </p>
        </div>
      </div>

      {/* Step content */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-10">
        <div className="animate-fade-in">
          {currentStep === 0 && (
            <StepAthlete onNext={() => goToStep(1)} />
          )}
          {currentStep === 1 && (
            <StepCalibration
              onBack={() => goToStep(0)}
              onNext={() => goToStep(2)}
            />
          )}
          {currentStep === 2 && (
            <StepRoute
              onBack={() => goToStep(1)}
              onNext={() => goToStep(3)}
            />
          )}
          {currentStep === 3 && (
            <StepFuel
              onBack={() => goToStep(2)}
              onNext={() => goToStep(4)}
            />
          )}
          {currentStep === 4 && (
            <StepAidStations
              onBack={() => goToStep(3)}
              onNext={() => goToStep(5)}
            />
          )}
          {currentStep === 5 && (
            <StepGenerate
              onBack={() => goToStep(4)}
              onGenerate={handleGenerate}
              isGenerating={state.isGenerating}
            />
          )}
        </div>
      </main>

      <LegalFooter compact />
    </div>
  );
}
