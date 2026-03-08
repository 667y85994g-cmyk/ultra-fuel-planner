import Link from "next/link";
import { Mountain } from "lucide-react";
import { LegalFooter } from "@/components/LegalFooter";

export const metadata = {
  title: "Disclaimer — Ultra Fuel Planner",
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-stone-800/60 bg-stone-950">
        <div className="mx-auto flex max-w-3xl items-center px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <Mountain className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Ultra Fuel Planner</span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold text-stone-50 mb-2">Disclaimer</h1>
        <p className="text-sm text-stone-500 mb-12">Last updated: March 2026</p>

        <p className="text-stone-400 leading-relaxed mb-10">
          Ultra Fuel Planner is a planning tool. The following points apply to
          any plan or guidance it produces.
        </p>

        <div className="space-y-6 text-stone-400 leading-relaxed">

          <div className="rounded-lg border border-stone-800 bg-stone-900/40 px-5 py-4">
            <h2 className="text-base font-semibold text-stone-200 mb-2">Plans are estimates, not prescriptions</h2>
            <p className="text-sm">
              All fuelling plans are based on your inputs, assumed models and
              route data. They are starting points for planning — not exact
              instructions to follow without thought.
            </p>
          </div>

          <div className="rounded-lg border border-stone-800 bg-stone-900/40 px-5 py-4">
            <h2 className="text-base font-semibold text-stone-200 mb-2">Test strategies in training first</h2>
            <p className="text-sm">
              Never rely on a fuelling approach in a race without testing it
              during training. Your gut, pace and preferences on race day may
              differ from what you expect.
            </p>
          </div>

          <div className="rounded-lg border border-stone-800 bg-stone-900/40 px-5 py-4">
            <h2 className="text-base font-semibold text-stone-200 mb-2">Individual tolerance varies</h2>
            <p className="text-sm">
              Carbohydrate tolerance, fluid needs and electrolyte requirements
              vary significantly between athletes. What works for one runner may
              not work for another, even in identical conditions.
            </p>
          </div>

          <div className="rounded-lg border border-stone-800 bg-stone-900/40 px-5 py-4">
            <h2 className="text-base font-semibold text-stone-200 mb-2">Conditions change needs</h2>
            <p className="text-sm">
              Weather, terrain, pace, fatigue and race-day stress can all shift
              your fuelling requirements away from any pre-planned values.
              Stay flexible and respond to how you actually feel.
            </p>
          </div>

          <div className="rounded-lg border border-stone-800 bg-stone-900/40 px-5 py-4">
            <h2 className="text-base font-semibold text-stone-200 mb-2">Not a substitute for professional advice</h2>
            <p className="text-sm">
              This tool does not replace advice from a qualified sports
              nutritionist, dietitian or coach. If you have specific health
              conditions, dietary needs or performance goals, seek professional
              guidance.
            </p>
          </div>

          <div className="rounded-lg border border-stone-800 bg-stone-900/40 px-5 py-4">
            <h2 className="text-base font-semibold text-stone-200 mb-2">Listen to your body</h2>
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
