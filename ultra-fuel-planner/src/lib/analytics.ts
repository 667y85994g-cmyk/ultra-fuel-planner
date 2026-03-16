/**
 * analytics.ts — GA4 event instrumentation for Ultra Fuel Planner
 *
 * All events are product-behavioural signals, not page-view vanity metrics.
 * The goal is to understand the planning journey:
 *   planner_opened → route_uploaded → profile_completed
 *   → plan_generated → plan_printed / plan_feedback
 *
 * GA4 is loaded via Next.js <Script strategy="afterInteractive"> in layout.tsx.
 * This module is a thin typed wrapper — it never throws, always guards against
 * SSR / missing GA ID / uninitialised gtag.
 */

// ── GA4 type shim ─────────────────────────────────────────────────────────────
type GtagFn = (...args: unknown[]) => void;

function gtag(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: GtagFn; dataLayer?: unknown[] };
  if (typeof w.gtag === "function") {
    w.gtag(...args);
  }
}

function isEnabled(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
  );
}

// ── Core dispatch ─────────────────────────────────────────────────────────────

function track(event: string, params?: Record<string, string | number | boolean>) {
  if (!isEnabled()) return;
  gtag("event", event, params ?? {});
}

// ── planner_opened ────────────────────────────────────────────────────────────
// Fired when the planner wizard page mounts.
// Measures top-of-funnel traffic and device mix.

export function trackPlannerOpened(): void {
  track("planner_opened", {
    viewport_width: typeof window !== "undefined" ? window.innerWidth : 0,
  });
}

// ── route_uploaded ────────────────────────────────────────────────────────────
// Fired when a GPX file is successfully parsed and stored.
// Tells us what kinds of races users are actually planning.

export function trackRouteUploaded(params: {
  distance_km: number;
  elevation_gain_m: number;
  file_size_bytes: number;
}): void {
  track("route_uploaded", {
    distance_km:       Math.round(params.distance_km),
    elevation_gain_m:  Math.round(params.elevation_gain_m),
    file_size_bytes:   params.file_size_bytes,
  });
}

// ── profile_completed ─────────────────────────────────────────────────────────
// Fired when the runner completes "Your Event" (step 0) and advances.
// Measures drop-off before the algorithm runs and captures runner profile mix.

export function trackProfileCompleted(params: {
  experience_level:   string;
  fuelling_level:     string;
  event_intent:       string;
  has_prior_efforts:  boolean;
}): void {
  track("profile_completed", params);
}

// ── plan_generated ────────────────────────────────────────────────────────────
// The most important event — fired when generatePlan() succeeds.
// Captures what the algorithm produced in the real world.
// Critical for later algorithm analysis and calibration.

export function trackPlanGenerated(params: {
  distance_km:         number;
  elevation_gain_m:    number;
  finish_time_minutes: number;
  carb_target_min:     number;
  carb_target_max:     number;
  working_carb_target: number;
  avg_carbs_per_hour:  number;
  fuelling_events:     number;
  sections:            number;
  drink_mix_used:      boolean;
  event_intent:        string;
}): void {
  track("plan_generated", {
    distance_km:         Math.round(params.distance_km),
    elevation_gain_m:    Math.round(params.elevation_gain_m),
    finish_time_minutes: Math.round(params.finish_time_minutes),
    carb_target_min:     params.carb_target_min,
    carb_target_max:     params.carb_target_max,
    working_carb_target: params.working_carb_target,
    avg_carbs_per_hour:  params.avg_carbs_per_hour,
    fuelling_events:     params.fuelling_events,
    sections:            params.sections,
    drink_mix_used:      params.drink_mix_used,
    event_intent:        params.event_intent,
  });
}

// ── plan_printed ──────────────────────────────────────────────────────────────
// Fired when the print page triggers window.print().
// Strong intent signal — runner is taking the plan to race day.

export function trackPlanPrinted(): void {
  track("plan_printed");
}

// ── plan_feedback ─────────────────────────────────────────────────────────────
// Fired from the simple Yes / Not really prompt on the results page.
// Measures whether runners trust the output.

export function trackPlanFeedback(helpful: boolean): void {
  track(helpful ? "plan_feedback_positive" : "plan_feedback_negative");
}
