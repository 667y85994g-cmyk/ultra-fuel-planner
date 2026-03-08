import Link from "next/link";
import { Mountain } from "lucide-react";
import { LegalFooter } from "@/components/LegalFooter";

export const metadata = {
  title: "Terms of Use — Ultra Fuel Planner",
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-stone-50 mb-2">Terms of Use</h1>
        <p className="text-sm text-stone-500 mb-12">Last updated: March 2026</p>

        <div className="space-y-10 text-stone-400 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-stone-200 mb-3">What this service is</h2>
            <p>
              Ultra Fuel Planner is a free online tool that helps trail and ultra
              runners plan fuelling strategies for their races and long runs. It
              generates estimates based on the inputs you provide — including past
              race data, GPX route files, fuel products and aid station locations.
            </p>
            <p className="mt-3">
              It is an informational planning tool only. It is not a personalised
              coaching service, a nutrition programme or a medical product.
            </p>
          </section>

          <div className="border-t border-stone-800" />

          <section>
            <h2 className="text-lg font-semibold text-stone-200 mb-3">No professional advice</h2>
            <p>
              Nothing in Ultra Fuel Planner constitutes medical, nutritional,
              dietary, coaching or other professional advice. The plans and
              recommendations produced are general estimates based on widely used
              training principles and the data you enter.
            </p>
            <p className="mt-3">
              You should use your own judgement when reviewing any output. If you
              have specific health conditions, dietary requirements or concerns
              about race nutrition, consult a qualified professional before
              acting on any guidance from this tool.
            </p>
          </section>

          <div className="border-t border-stone-800" />

          <section>
            <h2 className="text-lg font-semibold text-stone-200 mb-3">Use at your own risk</h2>
            <p>
              Fuelling plans produced by this tool are estimates. They are based
              on your inputs, assumed pace models and route data. Actual race
              conditions, your tolerance on the day, weather, fatigue and many
              other factors will influence what works for you.
            </p>
            <p className="mt-3">
              You are responsible for testing any fuelling strategy in training
              before relying on it in a race. You are responsible for the
              decisions you make on race day.
            </p>
          </section>

          <div className="border-t border-stone-800" />

          <section>
            <h2 className="text-lg font-semibold text-stone-200 mb-3">No guarantees</h2>
            <p>
              Ultra Fuel Planner is provided as-is. We make no guarantees about
              the accuracy, completeness or reliability of any plan it produces.
              We do not guarantee that the tool is fit for any particular purpose,
              that it will be available without interruption, or that it is free
              from errors.
            </p>
          </section>

          <div className="border-t border-stone-800" />

          <section>
            <h2 className="text-lg font-semibold text-stone-200 mb-3">Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, the providers of Ultra Fuel
              Planner are not liable for any injury, illness, loss, damage or
              other outcome arising from your use of this tool or any plan it
              generates. This includes outcomes during training or racing.
            </p>
          </section>

          <div className="border-t border-stone-800" />

          <section>
            <h2 className="text-lg font-semibold text-stone-200 mb-3">Changes and availability</h2>
            <p>
              Ultra Fuel Planner may be updated, changed, suspended or
              discontinued at any time without notice. The terms on this page may
              also be updated. Continued use of the tool after any changes
              constitutes acceptance of the updated terms.
            </p>
          </section>

          <div className="border-t border-stone-800" />

          <section>
            <h2 className="text-lg font-semibold text-stone-200 mb-3">Contact</h2>
            <p>
              For questions about these terms, contact:{" "}
              <a href="mailto:ben@trailhustle.com" className="text-stone-300 hover:text-stone-100 transition-colors">ben@trailhustle.com</a>
            </p>
          </section>

        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
