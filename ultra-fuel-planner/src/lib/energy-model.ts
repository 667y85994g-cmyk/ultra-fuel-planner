/**
 * Sports-science energy expenditure model for trail running / ultramarathon.
 *
 * References
 * ----------
 * [Minetti 2002]  Minetti AE et al. Energy cost of walking and running at
 *   extreme uphill and downhill slopes. J Appl Physiol 93(3):1039–46.
 *   → Provides the polynomial Cr(i) fit to treadmill O₂ data across -0.45→+0.45 grade.
 *
 * [Brooks 1994]   Brooks GA & Mercier J. Balance of carbohydrate and lipid
 *   utilization during exercise: the "crossover" concept.
 *   J Appl Physiol 76(6):2253–61.
 *   → Describes the intensity-dependent shift from fat to CHO oxidation.
 *
 * [Burke 2011]    Burke LM et al. Carbohydrates for training and competition.
 *   J Sports Sci 29 Suppl 1:S17–27.
 *   → Practical carbohydrate intake guidelines; gut absorption limits.
 *
 * [Jeukendrup 2014] Jeukendrup AE. A step towards personalised sports nutrition.
 *   Sports Med 44 Suppl 1:S25–33.
 *   → Multi-transporter CHO ceiling (90 g/hr glucose+fructose 2:1).
 */

export type RaceIntensity = "easy" | "moderate" | "hard" | "race";
export type FatAdaptation  = "low" | "medium" | "high";

// ─── Minetti (2002): Cost of Running ──────────────────────────────────────────

/**
 * Energy cost of locomotion as a function of slope [Minetti 2002].
 *
 * Returns Cr in J · kg⁻¹ · m⁻¹.
 *
 * The polynomial captures:
 *   • Flat (0 %): 3.6 J/kg/m ≈ 0.86 kcal/kg/km
 *   • Uphill (+20 %): ~9 J/kg/m — very costly
 *   • Downhill (-10 %): ~2 J/kg/m — partly free thanks to gravity
 *   • Steep downhill (-30 %): ~5 J/kg/m — eccentric braking cost rises again
 *
 * Valid range: gradient ∈ [-0.45, +0.45] (rise ÷ run, NOT percentage).
 * Clamped outside this range rather than extrapolated.
 */
export function minettiCr(gradient: number): number {
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

// ─── Caloric burn rate ────────────────────────────────────────────────────────

/**
 * Gross caloric expenditure in kcal / hr.
 *
 * Derivation:
 *   power [W] = Cr [J/kg/m] × mass [kg] × speed [m/s]
 *   kcal/hr   = power_W × 3600 [s/hr] ÷ 4184 [J/kcal]
 *
 * @param weightKg  Athlete body mass (kg)
 * @param speedKmh  Ground speed (km/h).  Use the segment's actual estimated
 *                  pace — Minetti's Cr already accounts for grade energy cost,
 *                  so do NOT apply a separate grade correction to speed.
 * @param gradient  Slope as rise/run fraction (e.g. 0.15 for a 15 % grade).
 *                  Convert from avgGradientPct by dividing by 100.
 */
export function caloricBurnRate(
  weightKg: number,
  speedKmh: number,
  gradient: number,
): number {
  const speedMs = speedKmh / 3.6;
  const cr      = minettiCr(gradient);         // J / kg / m
  const powerW  = cr * weightKg * speedMs;     // W = J / s
  return (powerW * 3600) / 4184;               // kcal / hr
}

// ─── CHO oxidation fraction ───────────────────────────────────────────────────

/**
 * Fraction of gross caloric expenditure sourced from carbohydrate oxidation.
 *
 * Based on the "crossover concept" [Brooks 1994]:
 *   ~25 % CHO at 40 % VO₂max  (fat-predominant — easy hiking)
 *   ~55 % CHO at 65 % VO₂max  (crossover zone — typical ultramarathon)
 *   ~85 % CHO at 90 % VO₂max  (near-maximal sprint)
 *
 * The linear approximation below fits published RER/indirect-calorimetry data:
 *   choFraction = 0.25 + (intensity - 0.40) × 1.20   [clamped to 0.15–0.95]
 *
 * Fat adaptation (LCHF/low-carb training) shifts the crossover point
 * approximately 8–12 % VO₂max rightward, reducing CHO fraction at any
 * given intensity and increasing reliance on fat oxidation.
 *
 * @param intensityFraction  Current exercise intensity as fraction of VO₂max (0–1)
 * @param fatAdaptation      Dietary / training fat adaptation level
 */
export function choFraction(
  intensityFraction: number,
  fatAdaptation: FatAdaptation = "low",
): number {
  // Slope: (0.85 − 0.25) / (0.90 − 0.40) = 1.20
  const base    = 0.25 + (intensityFraction - 0.40) * 1.20;
  const clamped = Math.max(0.15, Math.min(0.95, base));

  // Fat adaptation shifts the crossover rightward
  const adaptAdj =
    fatAdaptation === "high"   ? -0.12 :
    fatAdaptation === "medium" ? -0.06 :
    0;

  return Math.max(0.10, Math.min(0.95, clamped + adaptAdj));
}

// ─── Intensity bands ──────────────────────────────────────────────────────────

/**
 * Nominal fraction of VO₂max for each user-selectable race intensity band.
 *
 * These reflect sustained effort levels typical of ultramarathon racing,
 * not short-burst maximal intervals.
 *
 *   easy     ≈ Z1–2, RPE 4–5 | 8–24 h+ events, back-of-field 100-miler
 *   moderate ≈ Z2–3, RPE 5–6 | Standard 50–100 mile ultramarathon pace
 *   hard     ≈ Z3–4, RPE 6–7 | Competitive 50-mile / shorter ultra effort
 *   race     ≈ Z4–5, RPE 7–8 | 50 K race effort / fast 50-mile front-of-field
 */
export const INTENSITY_VO2MAX: Record<RaceIntensity, number> = {
  easy:     0.52,
  moderate: 0.62,
  hard:     0.72,
  race:     0.80,
};

export const INTENSITY_LABELS: Record<RaceIntensity, string> = {
  easy:     "Easy (Z1–2, ~52% VO₂max)",
  moderate: "Moderate (Z2–3, ~62% VO₂max)",
  hard:     "Hard (Z3–4, ~72% VO₂max)",
  race:     "Race effort (Z4–5, ~80% VO₂max)",
};

export const INTENSITY_DESCRIPTIONS: Record<RaceIntensity, string> = {
  easy:     "Comfortable, conversational pace. Typical for 24 h+ or back-of-field 100-milers.",
  moderate: "Steady effort, controlled breathing. Standard 50–100 mile ultramarathon pace.",
  hard:     "Comfortably hard, talking in short sentences. Competitive 50-mile effort.",
  race:     "Near threshold, breathing heavily. 50 K race pace or front-of-field ultra.",
};

// ─── Fuelling rules ───────────────────────────────────────────────────────────

/**
 * Caloric expenditure that triggers one fuel event (kcal).
 *
 * At 300 kcal burned, consume one exogenous carbohydrate dose.
 * This interval is calibrated to:
 *   • Maintain blood glucose homeostasis without gut overloading
 *   • Align with practical race execution (one gel / chew per event)
 *   • Reflect isotope-tracer data showing ~1 g/min peak exogenous CHO
 *     oxidation for glucose-only sources
 */
export const FUEL_TRIGGER_KCAL = 300;

/**
 * Exogenous carbohydrate delivered per fuel event (g).
 *
 * 25 g × 4.1 kcal/g = 102.5 kcal — a partial replacement of the 300 kcal burned.
 * This conservatively targets ~34% exogenous energy replacement while staying
 * well below the gut absorption ceiling for most athletes.
 *
 * Practical note: most gels/chews deliver 20–30 g carbs per serving, making
 * a single serving per event the standard execution.
 */
export const CARBS_PER_FUEL_EVENT_G = 25;

/**
 * Maximum gut absorption rate for exogenous carbohydrates [Burke 2011, Jeukendrup 2014].
 *
 *   ~60 g/hr  — single-transporter sources (glucose / maltodextrin only)
 *   ~90 g/hr  — multi-transporter sources (glucose + fructose 2:1 or 1:0.8)
 *
 * The engine targets ≤ 90 g/hr. At very high caloric burn rates (900+ kcal/hr)
 * the derived target is capped here to avoid gut overload.
 */
export const CHO_ABSORPTION_LIMIT_G_HR = 90;

// ─── Core calculations ────────────────────────────────────────────────────────

/**
 * Fuelling interval (minutes) given the current caloric burn rate.
 *
 * interval = FUEL_TRIGGER_KCAL / kcalPerHour × 60
 *
 * Clamped to [15, 60]:
 *   15 min — practical minimum in race conditions (too frequent = GI distress)
 *   60 min — absolute maximum (glycogen depletion risk after 60+ min without CHO)
 */
export function fuellingIntervalMinutes(kcalPerHour: number): number {
  if (kcalPerHour <= 0) return 45;
  const raw = (FUEL_TRIGGER_KCAL / kcalPerHour) * 60;
  return Math.round(Math.max(15, Math.min(60, raw)));
}

/**
 * Effective exogenous carbohydrate delivery rate (g/hr) implied by the
 * 300 kcal / 25 g fuelling rule.
 *
 * Derivation:
 *   events/hr = kcalPerHour / FUEL_TRIGGER_KCAL
 *   g/hr      = events/hr × CARBS_PER_FUEL_EVENT_G
 *             = kcalPerHour × 25 / 300
 *             = kcalPerHour / 12
 *
 * Mathematical consistency check:
 *   carbTarget/hr × interval = (kcal/12) × (300/kcal × 60 min) = 150 g·min/hr / 6 = 25 g ✓
 *
 * Clamped to [30, CHO_ABSORPTION_LIMIT_G_HR].
 */
export function derivedCarbGPerHour(kcalPerHour: number): number {
  const raw = (CARBS_PER_FUEL_EVENT_G / FUEL_TRIGGER_KCAL) * kcalPerHour;
  return Math.round(Math.max(30, Math.min(CHO_ABSORPTION_LIMIT_G_HR, raw)));
}

/**
 * CHO burn rate in g/hr (how fast the body is oxidising its own carbohydrate).
 * Useful for understanding depletion risk — NOT the exogenous replacement target.
 *
 * @param kcalPerHour      Gross caloric burn rate
 * @param intensityFraction Fraction of VO₂max
 * @param fatAdaptation    Fat adaptation level
 */
export function choBurnRateGPerHour(
  kcalPerHour: number,
  intensityFraction: number,
  fatAdaptation: FatAdaptation = "low",
): number {
  const choFrac = choFraction(intensityFraction, fatAdaptation);
  return Math.round((kcalPerHour * choFrac) / 4.1);
}
