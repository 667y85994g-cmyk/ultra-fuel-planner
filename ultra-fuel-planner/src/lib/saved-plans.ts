import type { StoredPlannerState } from "@/types";

const KEY_PREFIX = "ufp_save_";

export interface SavedPlan {
  id: string;        // full localStorage key, used as delete handle
  name: string;
  savedAt: string;   // ISO date string
  eventName?: string; // shown in the list for identification
}

interface SavedPlanData extends SavedPlan {
  state: StoredPlannerState;
}

export function listSavedPlans(): SavedPlan[] {
  if (typeof window === "undefined") return [];
  const plans: SavedPlan[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(KEY_PREFIX)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as SavedPlanData;
      plans.push({
        id: parsed.id,
        name: parsed.name,
        savedAt: parsed.savedAt,
        eventName: parsed.eventName,
      });
    } catch {
      // corrupted entry — skip
    }
  }
  return plans.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function savePlan(name: string, state: StoredPlannerState): void {
  if (typeof window === "undefined") return;
  const id = `${KEY_PREFIX}${Date.now()}`;
  const plan: SavedPlanData = {
    id,
    name,
    savedAt: new Date().toISOString(),
    eventName: state.eventName,
    state,
  };
  try {
    localStorage.setItem(id, JSON.stringify(plan));
  } catch {
    // storage quota exceeded — fail silently
  }
}

export function loadSavedPlan(id: string): StoredPlannerState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(id);
    if (!raw) return null;
    return (JSON.parse(raw) as SavedPlanData).state;
  } catch {
    return null;
  }
}

export function deleteSavedPlan(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(id);
}
