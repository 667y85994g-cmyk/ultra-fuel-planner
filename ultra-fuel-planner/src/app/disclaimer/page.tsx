import { SiteNav } from "@/components/SiteNav";
import { LegalFooter } from "@/components/LegalFooter";

export const metadata = {
  title: "Disclaimer — Ultra Fuel Planner",
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <SiteNav />

      {/* Content */}
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold text-ink mb-2">Disclaimer</h1>
        <p className="text-sm text-ink-3 mb-12">Last updated: March 2026</p>

        <p className="text-ink-3 leading-relaxed mb-10">
          Ultra Fuel Planner is a planning tool. The following points apply to
          any plan or guidance it produces.
        </p>

        <div className="space-y-6 text-ink-3 leading-relaxed">

          <div className="rounded-lg border border-rule bg-paper/40 px-5 py-4">
            <h2 className="text-base font-semibold text-ink-2 mb-2">Plans are estimates, not prescriptions</h2>
            <p className="text-sm">
              All fuelling plans are based on your inputs, assumed models and
              route data. They are starting points for planning — not exact
              instructions to follow without thought.
            </p>
          </div>

          <div className="rounded-lg border border-rule bg-paper/40 px-5 py-4">
            <h2 className="text-base font-semibold text-ink-2 mb-2">Test strategies in training first</h2>
            <p className="text-sm">
              Never rely on a fuelling approach in a race without testing it
              during training. Your gut, pace and preferences on race day may
              differ from what you expect.
            </p>
          </div>

          <div className="rounded-lg border border-rule bg-paper/40 px-5 py-4">
            <h2 className="text-base font-semibold text-ink-2 mb-2">Individual tolerance varies</h2>
            <p className="text-sm">
              Carbohydrate tolerance, fluid needs and electrolyte requirements
              vary significantly between athletes. What works for one runner may
              not work for another, even in identical conditions.
            </p>
          </div>

          <div className="rounded-lg border border-rule bg-paper/40 px-5 py-4">
            <h2 className="text-base font-semibold text-ink-2 mb-2">Conditions change needs</h2>
            <p className="text-sm">
              Weather, terrain, pace, fatigue and race-day stress can all shift
              your fuelling requirements away from any pre-planned values.
              Stay flexible and respond to how you actually feel.
            </p>
          </div>

          <div className="rounded-lg border border-rule bg-paper/40 px-5 py-4">
            <h2 className="text-base font-semibold text-ink-2 mb-2">Not a substitute for professional advice</h2>
            <p className="text-sm">
              This tool does not replace advice from a qualified sports
              nutritionist, dietitian or coach. If you have specific health
              conditions, dietary needs or performance goals, seek professional
              guidance.
            </p>
          </div>

          <div className="rounded-lg border border-rule bg-paper/40 px-5 py-4">
            <h2 className="text-base font-semibold text-ink-2 mb-2">Listen to your body</h2>
            <p className="text-sm">
              If a fuelling strategy is not working for you — causing nausea,
              GI distress, or discomfort — stop or adjust, regardless of what
              any plan says. No plan is worth pushing through something that is
              clearly not working.
            </p>
          </div>

        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
