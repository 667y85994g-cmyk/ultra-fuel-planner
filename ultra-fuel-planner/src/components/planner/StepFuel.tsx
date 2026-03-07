"use client";

import { useState } from "react";
import { usePlanner } from "@/lib/planner-store";
import type { FuelItem, FuelType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
} from "lucide-react";
import { generateId, fuelTypeIcon, fuelTypeLabel } from "@/lib/utils";

interface Props {
  onBack: () => void;
  onNext: () => void;
}

const FUEL_TYPES: FuelType[] = [
  "gel",
  "chew",
  "drink_mix",
  "bar",
  "real_food",
  "capsule",
  "other",
];

const EMPTY_ITEM = (): Partial<FuelItem> => ({
  productName: "",
  brand: "",
  type: "gel",
  carbsPerServing: 22,
  sodiumPerServingMg: 50,
  fluidContributionMl: 0,
  caffeinePerServingMg: 0,
  caloriesPerServing: 90,
  easyOnClimbs: false,
  easyAtHighEffort: false,
  requiresChewing: false,
  sweetnessScore: 3,
  lateRaceToleranceScore: 4,
  quantityAvailable: 5,
});

export function StepFuel({ onBack, onNext }: Props) {
  const { state, dispatch } = usePlanner();
  const inventory = state.fuelInventory ?? [];
  const [editing, setEditing] = useState<FuelItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Partial<FuelItem>>(EMPTY_ITEM());

  const totalCarbs = inventory.reduce(
    (a, item) => a + item.carbsPerServing * item.quantityAvailable,
    0
  );

  const startAdd = () => {
    setDraft(EMPTY_ITEM());
    setAdding(true);
    setEditing(null);
  };

  const startEdit = (item: FuelItem) => {
    setDraft({ ...item });
    setEditing(item);
    setAdding(false);
  };

  const cancel = () => {
    setAdding(false);
    setEditing(null);
  };

  const save = () => {
    if (!draft.productName) return;
    const item: FuelItem = {
      id: editing?.id ?? generateId(),
      productName: draft.productName!,
      brand: draft.brand ?? "",
      type: (draft.type as FuelType) ?? "gel",
      carbsPerServing: Number(draft.carbsPerServing ?? 0),
      sodiumPerServingMg: Number(draft.sodiumPerServingMg ?? 0),
      fluidContributionMl: Number(draft.fluidContributionMl ?? 0),
      caffeinePerServingMg: Number(draft.caffeinePerServingMg ?? 0),
      caloriesPerServing: Number(draft.caloriesPerServing ?? 0),
      easyOnClimbs: Boolean(draft.easyOnClimbs),
      easyAtHighEffort: Boolean(draft.easyAtHighEffort),
      requiresChewing: Boolean(draft.requiresChewing),
      sweetnessScore: (Number(draft.sweetnessScore ?? 3) as 1 | 2 | 3 | 4 | 5),
      lateRaceToleranceScore: (Number(draft.lateRaceToleranceScore ?? 4) as 1 | 2 | 3 | 4 | 5),
      quantityAvailable: Number(draft.quantityAvailable ?? 1),
    };

    if (editing) {
      dispatch({ type: "UPDATE_FUEL_ITEM", item });
    } else {
      dispatch({ type: "ADD_FUEL_ITEM", item });
    }

    cancel();
  };

  const remove = (id: string) => {
    dispatch({ type: "REMOVE_FUEL_ITEM", id });
  };

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-50">Add your fuel inventory</h1>
        <p className="mt-2 text-stone-400">
          Add everything you plan to carry. The planner matches fuel types to
          terrain and tells you what to take and when.
        </p>
      </div>

      <div className="space-y-4">
        {/* Summary bar */}
        {inventory.length > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-stone-800 bg-stone-900/40 px-5 py-3">
            <div className="text-sm text-stone-400">
              <span className="font-semibold text-stone-200">
                {inventory.length} items
              </span>{" "}
              ·{" "}
              <span className="font-semibold text-amber-400">
                {Math.round(totalCarbs)}g carbs
              </span>{" "}
              total
            </div>
            <Button size="sm" onClick={startAdd}>
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </div>
        )}

        {/* Item list */}
        {inventory.length === 0 && !adding && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="text-4xl">🍌</div>
              <div>
                <p className="font-medium text-stone-200">No fuel added yet</p>
                <p className="text-sm text-stone-500">
                  We&apos;ve pre-loaded some common items. Add or edit them below.
                </p>
              </div>
              <Button onClick={startAdd}>
                <Plus className="h-4 w-4" />
                Add first item
              </Button>
            </CardContent>
          </Card>
        )}

        {inventory.map((item) => (
          <div key={item.id}>
            {editing?.id === item.id ? (
              <FuelItemForm
                draft={draft}
                onChange={setDraft}
                onSave={save}
                onCancel={cancel}
              />
            ) : (
              <FuelItemCard item={item} onEdit={() => startEdit(item)} onDelete={() => remove(item.id)} />
            )}
          </div>
        ))}

        {/* Add form */}
        {adding && (
          <FuelItemForm
            draft={draft}
            onChange={setDraft}
            onSave={save}
            onCancel={cancel}
          />
        )}

        {inventory.length > 0 && !adding && !editing && (
          <button
            onClick={startAdd}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-700 py-4 text-sm text-stone-500 hover:border-stone-500 hover:text-stone-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add another item
          </button>
        )}

        {/* Nav */}
        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            size="lg"
            onClick={onNext}
            disabled={inventory.length === 0}
          >
            Next: Aid Stations
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Fuel item card ────────────────────────────────────────────────────────────

function FuelItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: FuelItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-stone-800 bg-stone-900/40 px-5 py-4">
      <div className="text-2xl flex-shrink-0">{fuelTypeIcon(item.type)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-stone-100">{item.productName}</span>
          {item.brand && (
            <span className="text-xs text-stone-500">{item.brand}</span>
          )}
          <Badge variant="secondary" className="text-xs">
            {fuelTypeLabel(item.type)}
          </Badge>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-stone-500">
          <span>
            <span className="text-amber-400 font-medium">{item.carbsPerServing}g</span> carbs/serving
          </span>
          <span>{item.sodiumPerServingMg}mg sodium</span>
          {item.caffeinePerServingMg > 0 && (
            <span>{item.caffeinePerServingMg}mg caffeine</span>
          )}
          <span>×{item.quantityAvailable} available</span>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="rounded-md p-2 text-stone-500 hover:bg-stone-800 hover:text-stone-300 transition-colors"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-md p-2 text-stone-500 hover:bg-red-900/30 hover:text-red-400 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Fuel item form ────────────────────────────────────────────────────────────

function FuelItemForm({
  draft,
  onChange,
  onSave,
  onCancel,
}: {
  draft: Partial<FuelItem>;
  onChange: (d: Partial<FuelItem>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const set = (k: keyof FuelItem, v: unknown) =>
    onChange({ ...draft, [k]: v });

  // Auto-set chewing based on type
  const handleTypeChange = (t: string) => {
    const requiresChewing = ["chew", "bar", "real_food"].includes(t);
    const easyOnClimbs = ["gel", "drink_mix", "capsule"].includes(t);
    onChange({
      ...draft,
      type: t as FuelType,
      requiresChewing,
      easyOnClimbs,
      easyAtHighEffort: easyOnClimbs,
    });
  };

  return (
    <Card className="border-amber-800/40">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {draft.id ? "Edit item" : "New fuel item"}
          </CardTitle>
          <button
            onClick={onCancel}
            className="text-stone-500 hover:text-stone-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Product name *</Label>
            <Input
              value={draft.productName ?? ""}
              onChange={(e) => set("productName", e.target.value)}
              placeholder="e.g. SIS Go Isotonic Gel"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Brand</Label>
            <Input
              value={draft.brand ?? ""}
              onChange={(e) => set("brand", e.target.value)}
              placeholder="e.g. Science in Sport"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Type</Label>
            <Select
              value={draft.type ?? "gel"}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FUEL_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {fuelTypeIcon(t)} {fuelTypeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quantity available (servings)</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={draft.quantityAvailable ?? ""}
              onChange={(e) => set("quantityAvailable", Number(e.target.value))}
              className="mt-1.5"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Carbs / serving (g)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={draft.carbsPerServing ?? ""}
              onChange={(e) => set("carbsPerServing", Number(e.target.value))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Sodium / serving (mg)</Label>
            <Input
              type="number"
              min={0}
              value={draft.sodiumPerServingMg ?? ""}
              onChange={(e) => set("sodiumPerServingMg", Number(e.target.value))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Caffeine / serving (mg)</Label>
            <Input
              type="number"
              min={0}
              value={draft.caffeinePerServingMg ?? ""}
              onChange={(e) =>
                set("caffeinePerServingMg", Number(e.target.value))
              }
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Calories / serving</Label>
            <Input
              type="number"
              min={0}
              value={draft.caloriesPerServing ?? ""}
              onChange={(e) => set("caloriesPerServing", Number(e.target.value))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Fluid contribution (ml)</Label>
            <Input
              type="number"
              min={0}
              value={draft.fluidContributionMl ?? ""}
              onChange={(e) => set("fluidContributionMl", Number(e.target.value))}
              className="mt-1.5"
            />
          </div>
        </div>

        {/* Scores */}
        <div className="grid gap-4 sm:grid-cols-2">
          <ScoreSelector
            label="Sweetness score"
            description="1 = savoury/bland, 5 = very sweet"
            value={draft.sweetnessScore ?? 3}
            onChange={(v) => set("sweetnessScore", v)}
          />
          <ScoreSelector
            label="Late-race tolerance"
            description="1 = often rejected, 5 = always works"
            value={draft.lateRaceToleranceScore ?? 3}
            onChange={(v) => set("lateRaceToleranceScore", v)}
          />
        </div>

        {/* Flags */}
        <div className="grid gap-3 sm:grid-cols-3">
          <FlagToggle
            label="Easy on climbs"
            description="No chewing required"
            checked={Boolean(draft.easyOnClimbs)}
            onChange={(v) => set("easyOnClimbs", v)}
          />
          <FlagToggle
            label="Easy at high effort"
            description="Goes down well when breathing hard"
            checked={Boolean(draft.easyAtHighEffort)}
            onChange={(v) => set("easyAtHighEffort", v)}
          />
          <FlagToggle
            label="Requires chewing"
            description="Not suitable for technical terrain"
            checked={Boolean(draft.requiresChewing)}
            onChange={(v) => set("requiresChewing", v)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            disabled={!draft.productName}
          >
            <Check className="h-4 w-4" />
            Save item
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreSelector({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <p className="mb-2 text-xs text-stone-500">{description}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              n <= value
                ? "bg-amber-800 text-amber-100"
                : "bg-stone-800 text-stone-500 hover:bg-stone-700"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function FlagToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-start gap-2 rounded-lg border p-3 text-left text-xs transition-colors ${
        checked
          ? "border-amber-700/40 bg-amber-900/20"
          : "border-stone-700 bg-stone-900/20 hover:border-stone-600"
      }`}
    >
      <div
        className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded border ${
          checked
            ? "border-amber-600 bg-amber-700"
            : "border-stone-600 bg-stone-800"
        } flex items-center justify-center`}
      >
        {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
      </div>
      <div>
        <div className="font-medium text-stone-200">{label}</div>
        <div className="text-stone-500">{description}</div>
      </div>
    </button>
  );
}
