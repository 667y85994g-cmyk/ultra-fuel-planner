import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ArrowRight, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/SiteNav";
import { LegalFooter } from "@/components/LegalFooter";

export const metadata: Metadata = {
  title: "How to Fuel an Ultra",
  description:
    "Practical guide to ultramarathon fuelling strategy — carb targets by race duration, terrain-aware execution, training vs race day, and why route-aware planning beats a generic calculator.",
  alternates: {
    canonical: "https://ultrafuelplanner.com/how-to-fuel-an-ultra",
  },
  openGraph: {
    title: "How to Fuel an Ultra | Ultra Fuel Planner",
    description:
      "Practical guide to ultramarathon fuelling — carb targets, terrain execution, and training vs race day strategy.",
    url: "https://ultrafuelplanner.com/how-to-fuel-an-ultra",
    type: "article",
  },
};

export default function HowToFuelAnUltra() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteNav />

      {/* Article */}
      <article className="mx-auto max-w-3xl px-6 py-16 md:py-24 text-[17px]">
        {/* Header */}
        <header className="mb-14">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-ochre/40 bg-ochre-hover/20 px-3 py-1.5 text-xs font-medium text-ochre">
            Fuelling guide
          </div>
          <h1 className="mb-5 text-4xl font-display leading-tight text-ink md:text-5xl">
            How to fuel an ultra
          </h1>
          <p className="text-lg leading-relaxed text-ink-3">
            Fuelling is the discipline most runners underestimate and the one
            that most often ends their race. This guide covers the practical
            framework — how much to eat, when, and why your route matters more
            than any generic calculator.
          </p>
        </header>

        {/* Section 1 */}
        <section className="mb-14">
          <h2 className="mb-4 text-2xl font-display text-ink">
            The central challenge
          </h2>
          <p className="mb-4 text-ink-2 leading-relaxed">
            In most sports, fuelling is simple: eat before, drink during, recover
            after. In ultras, fuelling is continuous, terrain-dependent, and
            constrained by a gut that gets less cooperative as the hours pass.
          </p>
          <p className="mb-4 text-ink-2 leading-relaxed">
            The core tension is this: your body burns somewhere between <span className="font-mono text-ink">500–900 kcal/hr</span> depending on pace, gradient, and body weight. Your
            gut can absorb at most <span className="font-mono text-ink">60–90 g/hr</span> of carbohydrate — and that
            ceiling drops as the race goes on. You cannot fuel by calories alone.
            You need a strategy built around what your gut can handle.
          </p>
          <p className="text-ink-2 leading-relaxed">
            That strategy also changes with the terrain under your feet. Eating a
            gel while climbing a 20% gradient is difficult. Eating a bar on a
            technical rocky descent is reckless. Real fuelling is execution-aware
            — it accounts for where you can actually stop to eat and where you
            need to just keep moving.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mb-14">
          <h2 className="mb-4 text-2xl font-display text-ink">
            How many carbs per hour?
          </h2>
          <p className="mb-4 text-ink-2 leading-relaxed">
            The honest answer: it depends on how long you&apos;re racing and how
            well-trained your gut is. Here are practical working ranges, based on
            current endurance fuelling guidance:
          </p>

          {/* Carb targets table */}
          <div className="mb-6 overflow-hidden rounded-xl border border-rule/50 bg-paper/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-rule/50">
                  <th className="px-5 py-3 text-left font-semibold text-ink-2">
                    Race duration
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-ink-2">
                    Recommended range
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-ink-2 hidden sm:table-cell">
                    Context
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-rule/60">
                  <td className="px-5 py-3 text-ink-2">Under 6 hours</td>
                  <td className="px-5 py-3 font-medium text-ochre">
                    55–90 g/hr
                  </td>
                  <td className="px-5 py-3 text-ink-3 hidden sm:table-cell">
                    Gut is fresh; high absorption possible
                  </td>
                </tr>
                <tr className="border-b border-rule/60">
                  <td className="px-5 py-3 text-ink-2">6–10 hours</td>
                  <td className="px-5 py-3 font-medium text-ochre">
                    50–80 g/hr
                  </td>
                  <td className="px-5 py-3 text-ink-3 hidden sm:table-cell">
                    Standard 50–100km range
                  </td>
                </tr>
                <tr className="border-b border-rule/60">
                  <td className="px-5 py-3 text-ink-2">10–16 hours</td>
                  <td className="px-5 py-3 font-medium text-ochre">
                    45–70 g/hr
                  </td>
                  <td className="px-5 py-3 text-ink-3 hidden sm:table-cell">
                    100km / shorter 100-mile races
                  </td>
                </tr>
                <tr className="border-b border-rule/60">
                  <td className="px-5 py-3 text-ink-2">16–24 hours</td>
                  <td className="px-5 py-3 font-medium text-ochre">
                    40–65 g/hr
                  </td>
                  <td className="px-5 py-3 text-ink-3 hidden sm:table-cell">
                    100-mile / longer events
                  </td>
                </tr>
                <tr className="border-b border-rule/60">
                  <td className="px-5 py-3 text-ink-2">24–36 hours</td>
                  <td className="px-5 py-3 font-medium text-ochre">
                    35–60 g/hr
                  </td>
                  <td className="px-5 py-3 text-ink-3 hidden sm:table-cell">
                    Multi-day / 200km+
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-ink-2">36 hours+</td>
                  <td className="px-5 py-3 font-medium text-ochre">
                    30–55 g/hr
                  </td>
                  <td className="px-5 py-3 text-ink-3 hidden sm:table-cell">
                    Pace is slow; gut fatigue is real
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mb-4 text-ink-2 leading-relaxed">
            These are recommended ranges, not precise requirements. Your working
            target — the number you plan your schedule around — will sit within
            this range based on your experience level, gut tolerance, and race
            priority.
          </p>
          <p className="text-ink-2 leading-relaxed">
            A common mistake is picking a carb target from a short race and
            applying it to a long one. A 70g/hr target that works perfectly in a
            6-hour event will often cause gut distress in hour 14 of a 100-miler.
            The gut becomes more stressed as race duration increases, and the
            practical upper limit decreases. Plan for the duration you&apos;re
            actually racing.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mb-14">
          <h2 className="mb-4 text-2xl font-display text-ink">
            Why terrain changes execution
          </h2>
          <p className="mb-4 text-ink-2 leading-relaxed">
            You can have the right carb target and still eat at the wrong moments.
            Terrain is the execution layer — it determines what you can
            practically consume and when.
          </p>

          <div className="mb-6 space-y-4">
            <div className="rounded-lg border border-rule/40 bg-paper/40 p-5">
              <h3 className="mb-2 text-sm font-semibold text-ochre">
                Steep and sustained climbs
              </h3>
              <p className="text-sm leading-relaxed text-ink-3">
                Breathing is hard. Chewing is impractical. This is the best
                time for gels — fast to open, easy to consume, no chewing
                required. Fluid intake also increases because you&apos;re
                sweating harder. Drink mix in your bottle provides continuous
                carb delivery without demanding attention.
              </p>
            </div>
            <div className="rounded-lg border border-rule/40 bg-paper/40 p-5">
              <h3 className="mb-2 text-sm font-semibold text-ochre">
                Flat and runnable sections
              </h3>
              <p className="text-sm leading-relaxed text-ink-3">
                Effort is lower, breathing is easier, and this is where
                eating is most practical. Bars, chews, and real food work
                well here. These sections are where you can top up carbs
                more deliberately — not just squeeze a gel on the move.
              </p>
            </div>
            <div className="rounded-lg border border-rule/40 bg-paper/40 p-5">
              <h3 className="mb-2 text-sm font-semibold text-ochre">
                Technical descents
              </h3>
              <p className="text-sm leading-relaxed text-ink-3">
                Hands may be needed for balance. Concentration is on footfall.
                This is not the time to be opening a wrapper. A good fuelling
                plan schedules nothing on technical descents and instead
                ensures you arrive at them topped up from the section before.
              </p>
            </div>
          </div>

          <p className="text-ink-2 leading-relaxed">
            The key insight is that fuelling needs to happen{" "}
            <em>before</em> difficult terrain, not during it. An experienced
            runner fuels proactively at the base of a big climb — not while
            gasping halfway up. A route-aware plan builds this into the
            schedule automatically.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mb-14">
          <h2 className="mb-4 text-2xl font-display text-ink">
            How race duration changes your strategy
          </h2>
          <p className="mb-4 text-ink-2 leading-relaxed">
            A 6-hour 50km and a 24-hour 100-miler are completely different
            physiological events, even if they both involve running. The fuelling
            strategy should reflect this.
          </p>
          <p className="mb-4 text-ink-2 leading-relaxed">
            In shorter events, gels and chews can carry the entire day. Gut
            tolerance is high, effort is high, and carb absorption is at its best.
            In longer events, food format needs to evolve. Real food becomes
            important not just for palatability but for gut rest — something
            that doesn&apos;t require the same absorption pathway as
            high-concentration carb products.
          </p>
          <p className="mb-4 text-ink-2 leading-relaxed">
            In very long races (20+ hours), drink mix often becomes the
            backbone of carb delivery because it requires no decision-making,
            no stopping, and no chewing. Discrete eating events — a gel here,
            a chew there — fill the gap. The ratio of continuous to discrete
            fuelling shifts as the race gets longer.
          </p>
          <p className="text-ink-2 leading-relaxed">
            Late-race fuelling is also harder psychologically. Sweetness
            fatigue is real. Many runners report that gels become unpleasant
            after 10 hours. Planning for this means scheduling less sweet
            options in the second half, varying formats deliberately, and not
            relying on a single product to carry the entire race.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mb-14">
          <h2 className="mb-4 text-2xl font-display text-ink">
            Training runs vs race day fuelling
          </h2>
          <p className="mb-4 text-ink-2 leading-relaxed">
            Race day fuelling should not be the first time you try your fuelling
            strategy. That sounds obvious, but many runners approach race day
            with a plan they&apos;ve never tested under load.
          </p>
          <p className="mb-4 text-ink-2 leading-relaxed">
            Training runs have a different goal than race fuelling. You&apos;re
            not trying to sustain maximum effort for 18 hours — you&apos;re
            teaching your gut to handle carb intake while running, building the
            habit of eating on schedule, and finding out which products you can
            actually tolerate when you&apos;re tired.
          </p>
          <p className="mb-4 text-ink-2 leading-relaxed">
            On training runs shorter than 5 hours, a reduced carb target
            (8–10g/hr lower than race-day targets) is often appropriate. The
            intensity is lower and the duration shorter. What matters more is
            the habit: eating at the right intervals, carrying the right
            products, opening gel wrappers with cold hands.
          </p>
          <p className="text-ink-2 leading-relaxed">
            A fuelling practice session — a run specifically designed to
            simulate race-day fuelling — is different again. Here you use your
            full race-day carb targets to stress-test your gut, practise your
            rhythm, and validate your product choices. Ultra Fuel Planner
            supports all three session types: race day, training run, and
            fuelling practice.
          </p>
        </section>

        {/* Section 6 */}
        <section className="mb-14">
          <h2 className="mb-4 text-2xl font-display text-ink">
            Why route-aware planning matters
          </h2>
          <p className="mb-4 text-ink-2 leading-relaxed">
            A generic fuelling calculator gives you a number: 60g of carbs per
            hour. It tells you nothing about when, what, or how much to carry
            between each checkpoint.
          </p>
          <p className="mb-4 text-ink-2 leading-relaxed">
            Your actual race has structure: a 4km climb starting at km 22, a
            technical descent into the valley, a long flat section to the second
            aid station, then a brutal final ascent. The fuelling rhythm for those
            sections is completely different — and a schedule that treats every
            hour identically isn&apos;t really a plan.
          </p>
          <p className="mb-4 text-ink-2 leading-relaxed">
            Route-aware planning uses your GPX file to understand where the
            climbs are, where the technical sections are, and how long each
            section between aid stations actually takes at your pace. It then
            builds a carry plan: what to pack, how much fluid to carry, how many
            gels to have on hand before the big climb.
          </p>
          <p className="text-ink-2 leading-relaxed">
            This is also what makes race fuelling different from training
            fuelling in practice. Your training routes probably don&apos;t
            have the same terrain profile as your race. A plan built from your
            race GPX is the closest you can get to a rehearsal without actually
            running it.
          </p>
        </section>

        {/* CTA card */}
        <div className="rounded-2xl border border-ochre/30 bg-ochre-hover/10 p-8 text-center">
          <Route className="mx-auto mb-4 h-8 w-8 text-ochre" aria-hidden="true" />
          <h2 className="mb-3 text-2xl font-display text-ink">
            Build your route-aware fuelling plan
          </h2>
          <p className="mb-6 leading-relaxed text-ink-3">
            Upload your GPX file, add the fuel you carry, and generate a
            terrain-aware schedule with section-by-section carry guidance and a
            printable race card.
          </p>
          <Link href="/planner">
            <Button size="lg" className="gap-2">
              Start planning
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </article>

      <LegalFooter />
    </div>
  );
}
