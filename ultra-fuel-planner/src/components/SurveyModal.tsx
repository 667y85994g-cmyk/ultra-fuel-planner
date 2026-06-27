"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackSurveyCompleted, trackSurveyDismissed } from "@/lib/analytics";

export const SURVEY_STORAGE_KEY = "ufp_survey_v1";

const FEATURES = [
  { id: "store_plans",   label: "Store unlimited plans" },
  { id: "cross_device",  label: "Sync across iPhone, iPad and Mac" },
  { id: "live_race",     label: "Live race mode with GPS tracking" },
  { id: "apple_watch",   label: "Apple Watch glance during race" },
  { id: "healthkit",     label: "Auto-pull VO2max and HR zones from HealthKit" },
];

const PRICES = [
  { id: "under_10",  label: "Under £10 — one-off" },
  { id: "10_to_20",  label: "£10–£20 — one-off" },
  { id: "over_20",   label: "More than £20 — one-off" },
  { id: "subscription", label: "Monthly subscription" },
  { id: "free",      label: "Free — I wouldn't pay" },
];

interface Props {
  onClose: () => void;
}

export function SurveyModal({ onClose }: Props) {
  const [likelihood, setLikelihood] = useState<number | null>(null);
  const [features, setFeatures]     = useState<Set<string>>(new Set());
  const [price, setPrice]           = useState<string | null>(null);
  const [email, setEmail]           = useState("");
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleFeature = (id: string) => {
    setFeatures(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (likelihood === null) return;
    setSubmitting(true);

    const payload = {
      likelihood,
      features: Array.from(features).join(", ") || "none",
      price:    price ?? "not answered",
      email:    email.trim() || "not provided",
    };

    localStorage.setItem(
      SURVEY_STORAGE_KEY,
      JSON.stringify({ ...payload, completedAt: new Date().toISOString() })
    );

    const formspreeId = process.env.NEXT_PUBLIC_FORMSPREE_ID;
    if (formspreeId) {
      try {
        await fetch(`https://formspree.io/f/${formspreeId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // silent — response is already in localStorage
      }
    }

    trackSurveyCompleted(likelihood, price ?? "not answered");
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleDismiss = () => {
    localStorage.setItem(
      SURVEY_STORAGE_KEY,
      JSON.stringify({ dismissed: true, dismissedAt: new Date().toISOString() })
    );
    trackSurveyDismissed();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center bg-ink/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-paper rounded-xl border border-rule shadow-xl">
        <button
          onClick={handleDismiss}
          aria-label="Close survey"
          className="absolute right-4 top-4 text-ink-3 hover:text-ink-2 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-2xl font-bold text-ink">Thanks</p>
            <p className="text-sm text-ink-3 leading-relaxed">
              Your feedback will directly shape what we build next.
              {email.trim() && " We'll email you when the iOS app launches."}
            </p>
            <Button className="mt-4" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <div className="p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div>
              <p className="text-xs text-ochre font-semibold uppercase tracking-wider mb-1">60 seconds</p>
              <h2 className="text-lg font-bold text-ink">Help us decide what to build next</h2>
              <p className="text-sm text-ink-3 mt-0.5">No account. No spam. Just one question about what you'd pay for.</p>
            </div>

            {/* Q1 — Likelihood */}
            <div>
              <p className="text-sm font-medium text-ink mb-3">
                How likely would you be to pay for a Pro version of this?
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setLikelihood(n)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors ${
                      likelihood === n
                        ? "bg-ochre text-paper border-ochre"
                        : "border-rule text-ink-3 hover:border-ochre/40 hover:text-ink-2"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-ink-3">Not at all</span>
                <span className="text-xs text-ink-3">Definitely</span>
              </div>
            </div>

            {/* Q2 — Features */}
            <div>
              <p className="text-sm font-medium text-ink mb-3">
                Which features would make you pay?{" "}
                <span className="text-ink-3 font-normal">Pick all that apply.</span>
              </p>
              <div className="space-y-2">
                {FEATURES.map(f => {
                  const on = features.has(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => toggleFeature(f.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm border transition-colors ${
                        on
                          ? "bg-forest/10 border-forest/40 text-forest font-medium"
                          : "border-rule text-ink-2 hover:bg-paper-2/50"
                      }`}
                    >
                      <span className="mr-2 font-bold">{on ? "✓" : "○"}</span>
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q3 — Price */}
            <div>
              <p className="text-sm font-medium text-ink mb-3">What would you expect to pay?</p>
              <div className="space-y-2">
                {PRICES.map(p => {
                  const on = price === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPrice(p.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm border transition-colors ${
                        on
                          ? "bg-ochre/10 border-ochre/50 text-ochre font-medium"
                          : "border-rule text-ink-2 hover:bg-paper-2/50"
                      }`}
                    >
                      <span className={`mr-2 font-bold ${on ? "text-ochre" : "text-ink-3"}`}>
                        {on ? "●" : "○"}
                      </span>
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q4 — Email */}
            <div>
              <p className="text-sm font-medium text-ink mb-2">
                Notify me when the iOS app launches{" "}
                <span className="text-ink-3 font-normal">(optional)</span>
              </p>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={submitting || likelihood === null}
            >
              {submitting ? "Sending…" : "Submit feedback"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
