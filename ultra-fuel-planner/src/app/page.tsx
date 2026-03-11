import Link from "next/link";
import {
  Mountain,
  Route,
  FlaskConical,
  MapPin,
  ChevronRight,
  Zap,
  Activity,
  Package,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LegalFooter } from "@/components/LegalFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Beta notice — sits above the sticky nav, scrolls away */}
      <div className="border-b border-amber-800/20 bg-amber-900/10">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-2.5">
          <span className="flex-shrink-0 rounded bg-amber-800/40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400">
            Beta
          </span>
          <p className="text-xs text-stone-400">
            Ultra Fuel Planner is currently in beta. Plans should be tested in training before race day.
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 w-full border-b border-stone-800/60 bg-stone-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Mountain className="h-5 w-5 text-amber-500" />
            <span className="font-semibold tracking-tight text-stone-50">
              Ultra Fuel Planner
            </span>
          </div>
          <Link href="/planner">
            <Button size="sm">Start planning</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Topographic background texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Ccircle cx='200' cy='200' r='190' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3Ccircle cx='200' cy='200' r='160' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3Ccircle cx='200' cy='200' r='130' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3Ccircle cx='200' cy='200' r='100' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3Ccircle cx='200' cy='200' r='70' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3Ccircle cx='200' cy='200' r='40' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: "400px 400px",
          }}
        />

        <div className="mx-auto max-w-6xl px-6 py-24 md:py-36">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-800/40 bg-amber-900/20 px-4 py-1.5 text-xs font-medium text-amber-400">
              <Route className="h-3 w-3" />
              Route-aware fuelling planner
            </div>

            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-stone-50 sm:text-5xl md:text-6xl lg:text-7xl">
              Plan your fuelling for
              <br />
              <span className="text-amber-500">the route you&apos;re actually running.</span>
            </h1>

            <p className="mb-8 max-w-xl text-lg leading-relaxed text-stone-400">
              Upload your GPX file, enter your past race data, and add the fuel
              products you&apos;ll carry. The planner builds a fuelling schedule
              matched to your route and a carry plan between each checkpoint.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="/planner">
                <Button size="lg" className="gap-2">
                  Build your plan
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <span className="text-sm text-stone-500">
                Free. No account needed.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* What the planner helps you figure out */}
      <section className="border-t border-stone-800/60 bg-stone-950 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-2 text-center text-3xl font-bold text-stone-50">
            What the planner helps you figure out
          </h2>
          <p className="mb-14 text-center text-stone-400">
            The planning questions that matter for a long race.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-stone-800 bg-stone-900/40 p-6">
              <div className="mb-4 w-fit rounded-full bg-amber-900/20 p-3">
                <Zap className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-stone-100">
                How much to eat per hour
              </h3>
              <p className="text-sm text-stone-400 leading-relaxed">
                A carb target calibrated from your past runs — not a generic
                recommendation. Adjusted for your route and race length.
              </p>
            </div>
            <div className="rounded-xl border border-stone-800 bg-stone-900/40 p-6">
              <div className="mb-4 w-fit rounded-full bg-orange-900/20 p-3">
                <Mountain className="h-6 w-6 text-orange-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-stone-100">
                Where fuelling gets difficult
              </h3>
              <p className="text-sm text-stone-400 leading-relaxed">
                Steep climbs, long gaps between aid stations, and technical
                descents change what you can eat and when. The plan works
                around them.
              </p>
            </div>
            <div className="rounded-xl border border-stone-800 bg-stone-900/40 p-6">
              <div className="mb-4 w-fit rounded-full bg-blue-900/20 p-3">
                <Package className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-stone-100">
                What to carry between each checkpoint
              </h3>
              <p className="text-sm text-stone-400 leading-relaxed">
                A carry list for each section, using the specific gels, drink
                mixes and food you plan to use on race day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* See the output — race card preview */}
      <section className="border-t border-stone-800/60 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2 items-start">
            <div>
              <h2 className="mb-4 text-3xl font-bold text-stone-50">
                A race plan you can actually follow.
              </h2>
              <p className="mb-6 text-stone-400 leading-relaxed">
                The planner produces a race card you can print and carry in
                your vest. It breaks down what to eat, when to eat it, and
                what to carry between each aid station.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  { label: "Fuelling schedule", detail: "What to eat at each point, matched to the terrain you'll be on." },
                  { label: "Carry plan", detail: "What to pack between each aid station — items, quantities and approximate fluid." },
                  { label: "Hydration guidance", detail: "A practical drinking range, adjusted for expected conditions." },
                  { label: "Printable race card", detail: "A simple format you can print, fold and carry on race day." },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                    <div>
                      <span className="text-sm font-medium text-stone-200">
                        {item.label}:{" "}
                      </span>
                      <span className="text-sm text-stone-400">{item.detail}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <Link href="/planner">
                <Button variant="outline" className="gap-2">
                  Try it with your route
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Mock race card — realistic Lakeland 50 example */}
            <div className="rounded-xl border border-stone-700 bg-white p-5 text-stone-900 shadow-2xl shadow-black/40">
              {/* Card header */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b-2 border-amber-700">
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Lakeland 50
                  </h3>
                  <p className="text-[10px] text-stone-500">
                    Race Day Card
                  </p>
                </div>
                <div className="text-right text-[10px] text-stone-500">
                  <div>82km · ↑2,800m</div>
                </div>
              </div>

              {/* Summary strip */}
              <div className="grid grid-cols-3 gap-2 mb-4 bg-amber-50 rounded-md p-3">
                <div className="text-center">
                  <div className="text-sm font-bold text-amber-800">~14h 30m</div>
                  <div className="text-[9px] text-stone-500 uppercase">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-amber-800">60g</div>
                  <div className="text-[9px] text-stone-500 uppercase">Carbs/hr</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-blue-700">450–650 ml/hr</div>
                  <div className="text-[9px] text-stone-500 uppercase">Hydration</div>
                </div>
              </div>

              {/* Section header */}
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                  Section 1 of 6
                </p>
                <div className="flex-1 h-px bg-stone-200" />
              </div>
              <div className="flex items-center gap-1.5 mb-3 text-[11px]">
                <span className="font-semibold text-stone-800">Start</span>
                <span className="text-stone-400">→</span>
                <span className="font-semibold text-stone-800">CP1 Howtown</span>
                <span className="text-stone-400 ml-auto">km 0–22 · ~3h</span>
              </div>

              {/* Schedule — first section, realistic density */}
              <div className="space-y-0 text-[11px] mb-3">
                {[
                  { time: "06:35", km: "5.2", action: "Gel: SIS Isotonic", terrain: "Rolling", carbs: "22g", aid: false },
                  { time: "07:00", km: "8.5", action: "Drink: Maurten 320", terrain: "Flat", carbs: "40g", aid: false },
                  { time: "07:25", km: "12.0", action: "Chew: Torq Energy", terrain: "Flat", carbs: "30g", aid: false },
                  { time: "07:50", km: "14.5", action: "Gel: SIS Isotonic", terrain: "Climb", carbs: "22g", aid: false },
                  { time: "08:15", km: "18.0", action: "Drink: Maurten 320", terrain: "Rolling", carbs: "40g", aid: false },
                  { time: "08:40", km: "20.8", action: "Gel: SIS Caffeine", terrain: "Climb", carbs: "22g", aid: false },
                  { time: "09:00", km: "22.0", action: "🏁 CP1 Howtown — restock", terrain: "", carbs: "", aid: true },
                ].map((row, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded ${
                      row.aid ? "bg-amber-50" : i % 2 === 0 ? "bg-stone-50" : ""
                    }`}
                  >
                    <span className="w-9 flex-shrink-0 font-mono text-stone-400">{row.time}</span>
                    <span className="w-7 flex-shrink-0 text-stone-400">{row.km}</span>
                    <span className={`flex-1 font-medium ${row.aid ? "text-amber-700" : "text-stone-700"}`}>
                      {row.action}
                    </span>
                    {row.terrain && (
                      <span className="text-[9px] text-stone-400">{row.terrain}</span>
                    )}
                    {row.carbs && (
                      <span className="w-8 text-right text-amber-800 font-medium">{row.carbs}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Carry plan for section 1 */}
              <div className="bg-stone-50 rounded-md p-3 mb-3">
                <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                  Carry — Start to CP1 Howtown
                </p>
                <div className="flex gap-4 text-[11px] mb-1">
                  <span className="text-blue-700 font-medium">~1.5L fluid</span>
                  <span className="text-amber-800 font-medium">176g carbs</span>
                </div>
                <div className="text-[10px] text-stone-500">
                  2× SIS gel · 1× Caffeine gel · 1× Torq chew · Maurten 320 bottle
                </div>
              </div>

              {/* Full plan note */}
              <div className="text-center text-[10px] text-stone-400 mb-3">
                41 fuelling events across 6 sections · full schedule and carry plan generated
              </div>

              {/* Card footer */}
              <div className="pt-2 border-t border-stone-200 flex justify-between text-[9px] text-stone-400">
                <span>Ultra Fuel Planner v2.14</span>
                <span>All times are estimates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-stone-800/60 bg-stone-950 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-2 text-center text-3xl font-bold text-stone-50">
            How it works
          </h2>
          <p className="mb-14 text-center text-stone-400">
            Four steps. Your data, your route, your plan.
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Activity,
                step: "01",
                title: "Add your past runs",
                desc: "Enter a few past races or long runs — distance, time, elevation. The planner uses these to set realistic targets for your event.",
              },
              {
                icon: Route,
                step: "02",
                title: "Upload your race GPX",
                desc: "Drop in your GPX file. The planner reads the elevation profile and breaks the route into terrain segments.",
              },
              {
                icon: FlaskConical,
                step: "03",
                title: "Add your fuel products",
                desc: "Enter the gels, chews, bars and drink mixes you plan to use. Mark your aid stations and what they offer.",
              },
              {
                icon: MapPin,
                step: "04",
                title: "Generate your race plan",
                desc: "Get a fuelling schedule matched to your route, a carry plan for each section, and a printable race card.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-xl border border-stone-800 bg-stone-900/40 p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-lg bg-amber-900/30 p-2.5">
                    <item.icon className="h-5 w-5 text-amber-500" />
                  </div>
                  <span className="text-3xl font-bold text-stone-800">
                    {item.step}
                  </span>
                </div>
                <h3 className="mb-2 font-semibold text-stone-100">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-stone-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why it's different */}
      <section className="border-t border-stone-800/60 py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold text-stone-50">
            Not a calorie calculator.
          </h2>
          <p className="mb-10 text-center text-stone-400 leading-relaxed">
            What makes this different from a spreadsheet or a generic fuelling guide.
          </p>
          <div className="space-y-5">
            {[
              {
                title: "Calibrated from your past runs",
                desc: "Enter a few prior races or long training runs. The planner uses them to set carb and fluid targets you can realistically hit — not numbers from a generic table.",
              },
              {
                title: "Reads your GPX file",
                desc: "Your elevation profile tells the planner where the climbs, descents and flat sections are. It adjusts fuel format per terrain — gels on climbs, solids on flats, nothing on technical descents.",
              },
              {
                title: "Uses your actual products",
                desc: "You enter the specific gels, drink mixes and bars you own. The plan is built around those products, not theoretical grams of carbohydrate.",
              },
              {
                title: "Maps your aid stations",
                desc: "Mark where the checkpoints are and what they offer. The planner builds a carry plan for each section and tells you what to restock.",
              },
              {
                title: "Outputs a race card",
                desc: "The result is a simple printable card — not a spreadsheet. Fold it up and carry it in your vest pocket.",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0 rounded-full bg-amber-900/30 p-1.5">
                  <Check className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-200">{item.title}</h3>
                  <p className="mt-0.5 text-sm text-stone-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-stone-800/60 py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <Mountain className="mx-auto mb-6 h-10 w-10 text-amber-500 opacity-60" />
          <h2 className="mb-4 text-4xl font-bold text-stone-50">
            Race day is not the time to figure out fuelling.
          </h2>
          <p className="mb-8 text-stone-400 leading-relaxed">
            Build a practical plan from your own data. Know what to carry,
            when to eat, and what to restock at each aid station — before
            you toe the line.
          </p>
          <Link href="/planner">
            <Button size="lg" className="gap-2">
              Build your plan — it&apos;s free
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <LegalFooter />
    </div>
  );
}
