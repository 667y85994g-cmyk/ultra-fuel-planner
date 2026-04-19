"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlanner } from "@/lib/planner-store";
import { trackPlannerOpened } from "@/lib/analytics";
import { StepAthlete } from "@/components/planner/StepAthlete";
import { StepCalibration } from "@/components/planner/StepCalibration";
import { StepRoute } from "@/components/planner/StepRoute";
import { StepFuel } from "@/components/planner/StepFuel";
import { StepAidStations } from "@/components/planner/StepAidStations";
import { StepGenerate } from "@/components/planner/StepGenerate";

export default function PlannerPage() {
  const router = useRouter();
  const { state, dispatch, runPlanner } = usePlanner();
  const currentStep = state.currentStep;

  useEffect(() => { trackPlannerOpened(); }, []);

  const goToStep = (step: number) => {
    dispatch({ type: "SET_STEP", step });
  };

  const handleGenerate = () => {
    dispatch({ type: "SET_GENERATING", value: true });
    setTimeout(() => {
      runPlanner();
      dispatch({ type: "SET_GENERATING", value: false });
      router.push("/results");
    }, 300);
  };

  return (
    <div className="flex flex-col">
      {/* Beta notice */}
      <div className="border-b border-ochre/20 bg-ochre-hover/10">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-2">
          <span className="flex-shrink-0 rounded bg-ochre-hover/40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ochre">
            Beta
          </span>
          <p className="text-xs text-ink-3">
            Currently in beta. Plans should be tested in training before race day.
          </p>
        </div>
      </div>

      {/* Step content */}
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
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
      </div>
    </div>
  );
}
