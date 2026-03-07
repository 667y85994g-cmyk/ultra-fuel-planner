/**
 * Internal energy expenditure model for gradient-adjusted effort estimation.
 *
 * These functions power the personalised burn rate calculations behind the
 * scenes. The user-facing product describes itself as "route-aware" and
 * "personalised" — not as a calorie oracle or academic model.
 *
 * The gradient cost polynomial is well-established in exercise physiology
 * and captures the asymmetric energy cost of uphill vs downhill movement.
 */

// ─── Gradient-adjusted energy cost ───────────────────────────────────────────

/**
 * Energy cost of locomotion as a function of slope.
 * Returns cost in J/kg/m (joules per kilogram per metre).
 *
 * Captures:
 *   - Flat (0%): ~3.6 J/kg/m
 *   - Uphill (+20%): ~9 J/kg/m — very costly
 *   - Moderate downhill (-10%): ~2 J/kg/m — gravity assists
 *   - Steep downhill (-30%): ~5 J/kg/m — eccentric braking cost rises
 *
 * @param gradient  Slope as rise/run fraction (e.g. 0.15 for 15% grade).
 *                  Clamped to [-0.45, +0.45].
 */
export function gradientCostFactor(gradient: number): number {
  const g = Math.max(-0.45, Math.min(0.45, gradient));
  return (
    155.4 * g ** 5 -
     30.4 * g ** 4 -
     43.3 * g ** 3 +
     46.3 * g ** 2 +
     19.5 * g +
      3.6
  );
}

// Keep the old name as an alias for internal use
export const minettiCr = gradientCostFactor;

// ─── Caloric burn rate ────────────────────────────────────────────────────────

/**
 * Gross caloric expenditure in kcal/hr for a given weight, speed and gradient.
 *
 * @param weightKg  Athlete body mass (kg)
 * @param speedKmh  Ground speed (km/h)
 * @param gradient  Slope as rise/run fraction (e.g. 0.15 for 15%)
 */
export function caloricBurnRate(
  weightKg: number,
  speedKmh: number,
  gradient: number,
): number {
  const speedMs = speedKmh / 3.6;
  const cr = gradientCostFactor(gradient);
  const powerW = cr * weightKg * speedMs;
  return (powerW * 3600) / 4184;
}

/**
 * Estimate kcal/hr from a completed effort's summary stats.
 * Used by the calibration engine when no device calorie data is available.
 *
 * Approach: calculate average speed and average gradient from the totals,
 * then use the gradient cost model to estimate expenditure.
 *
 * @param weightKg      Athlete body mass
 * @param distanceKm    Total distance covered
 * @param durationMin   Total duration in minutes
 * @param elevationGainM Total ascent in metres
 */
export function estimateKcalPerHour(
  weightKg: number,
  distanceKm: number,
  durationMin: number,
  elevationGainM: number,
): number {
  if (durationMin <= 0 || distanceKm <= 0) return 400;
  const durationHours = durationMin / 60;
  const avgSpeedKmh = distanceKm / durationHours;

  // Estimate effective average gradient from total climb over distance
  // This is a simplification — real routes have varying gradients
  const avgGradient = elevationGainM / (distanceKm * 1000);
  // Blend flat + climb costs: roughly 60% of distance at low grade, 40% at climb grade
  const flatCost = caloricBurnRate(weightKg, avgSpeedKmh, 0);
  const climbCost = caloricBurnRate(weightKg, avgSpeedKmh * 0.6, avgGradient * 2);

  // Weight by approximate terrain split based on elevation density
  const elevDensity = elevationGainM / distanceKm; // m gain per km
  const climbFraction = Math.min(0.6, elevDensity / 100); // cap at 60% climb
  const blended = flatCost * (1 - climbFraction) + climbCost * climbFraction;

  return Math.round(Math.max(200, blended));
}

// ─── Fuelling calculations ───────────────────────────────────────────────────

/**
 * Every ~300 kcal burned triggers one fuelling event (~25g carbs).
 * These constants define the baseline fuelling rhythm.
 */
export const FUEL_TRIGGER_KCAL = 300;
export const CARBS_PER_FUEL_EVENT_G = 25;
export const CHO_ABSORPTION_LIMIT_G_HR = 90;

/**
 * Fuelling interval in minutes given the current caloric burn rate.
 * Clamped to [15, 60] for practical race execution.
 */
export function fuellingIntervalMinutes(kcalPerHour: number): number {
  if (kcalPerHour <= 0) return 45;
  const raw = (FUEL_TRIGGER_KCAL / kcalPerHour) * 60;
  return Math.round(Math.max(15, Math.min(60, raw)));
}

/**
 * Effective exogenous carb delivery rate (g/hr) implied by the burn rate.
 * Clamped to [30, 90].
 */
export function derivedCarbGPerHour(kcalPerHour: number): number {
  const raw = (CARBS_PER_FUEL_EVENT_G / FUEL_TRIGGER_KCAL) * kcalPerHour;
  return Math.round(Math.max(30, Math.min(CHO_ABSORPTION_LIMIT_G_HR, raw)));
}
