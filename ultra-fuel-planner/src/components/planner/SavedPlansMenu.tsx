"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bookmark, BookmarkCheck, Trash2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlanner } from "@/lib/planner-store";
import {
  listSavedPlans,
  savePlan,
  loadSavedPlan,
  deleteSavedPlan,
  type SavedPlan,
} from "@/lib/saved-plans";

export function SavedPlansMenu() {
  const { state, dispatch } = usePlanner();
  const [open, setOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshPlans = useCallback(() => {
    setPlans(listSavedPlans());
  }, []);

  useEffect(() => {
    if (open) refreshPlans();
  }, [open, refreshPlans]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSave = () => {
    const name = saveName.trim() || state.eventName || "Untitled plan";
    savePlan(name, {
      athlete: state.athlete,
      guidedProfile: state.guidedProfile,
      eventName: state.eventName,
      eventType: state.eventType,
      racePriority: state.racePriority,
      raceStartTime: state.raceStartTime,
      expectedTemperatureC: state.expectedTemperatureC,
      targetDistanceKm: state.targetDistanceKm,
      targetFinishTimeMinutes: state.targetFinishTimeMinutes,
      eventIntent: state.eventIntent,
      preRunFuelled: state.preRunFuelled,
      fuelInventory: state.fuelInventory,
      aidStations: state.aidStations,
      parsedRoute: state.parsedRoute,
      priorEfforts: state.priorEfforts,
    });
    setSaveName("");
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
    refreshPlans();
  };

  const handleLoad = (id: string) => {
    const planState = loadSavedPlan(id);
    if (planState) {
      dispatch({ type: "LOAD_SAVED", state: planState });
      setOpen(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteSavedPlan(id);
    refreshPlans();
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className="gap-1.5 text-stone-400 border-stone-700 bg-stone-900 hover:bg-stone-800 hover:text-stone-200"
      >
        <Bookmark className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Saves</span>
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-stone-700 bg-stone-900 shadow-2xl shadow-black/60 z-50 overflow-hidden">

          {/* Save current plan */}
          <div className="p-3 border-b border-stone-800">
            <p className="text-xs text-stone-500 mb-2">Save current plan</p>
            <div className="flex gap-2">
              <Input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder={state.eventName || "Plan name…"}
                className="h-8 text-xs bg-stone-800 border-stone-700 text-stone-200 placeholder:text-stone-600 focus-visible:ring-amber-500/40"
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              />
              <Button
                size="sm"
                className="h-8 px-3 flex-shrink-0 gap-1"
                onClick={handleSave}
              >
                {justSaved ? (
                  <BookmarkCheck className="h-3.5 w-3.5" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>

          {/* Saved plans list */}
          <div className="max-h-64 overflow-y-auto">
            {plans.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <FolderOpen className="h-5 w-5 text-stone-700" />
                <p className="text-xs text-stone-600">No saved plans yet</p>
              </div>
            ) : (
              plans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center gap-2 px-3 py-2.5 hover:bg-stone-800/60 border-b border-stone-800/40 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-200 truncate font-medium leading-tight">
                      {plan.name}
                    </p>
                    <p className="text-[10px] text-stone-600 mt-0.5">
                      {formatDate(plan.savedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleLoad(plan.id)}
                    className="text-xs text-amber-500 hover:text-amber-400 flex-shrink-0 px-1 py-0.5 rounded hover:bg-amber-900/20 transition-colors"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="text-stone-700 hover:text-red-400 flex-shrink-0 transition-colors"
                    aria-label="Delete saved plan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
