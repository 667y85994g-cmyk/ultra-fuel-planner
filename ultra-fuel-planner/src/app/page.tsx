import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Ultra Fuel Planner | Build a Fuelling Plan for Your Ultra Marathon",
  description:
    "Build a practical fuelling plan for your ultra. Upload your route, use data from your runs, and know exactly what to eat and when on race day.",
  alternates: {
    canonical: "https://ultrafuelplanner.com",
  },
};

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
              Upload your route, use data from your previous runs, and build a
              fuelling plan you can actually follow on race day.
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
                A recommended range based on your race duration and prior runs —
                not a number from a generic table. The planner selects a working
                target within that range to build your schedule around.
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

            {/* Mock race card — faithful to current v2.28 print Page 1 layout */}
            <div className="rounded-xl border border-stone-700 bg-white p-5 text-stone-900 shadow-2xl shadow-black/40 text-[11px]">

              {/* ── Card header ─────────────────────────────────────── */}
              <div className="flex items-start justify-between pb-3 mb-3 border-b-[3px] border-amber-700">
                <div>
                  <h3 className="text-[18px] font-extrabold leading-tight text-stone-900">
                    Lakeland 50
                  </h3>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    Ultra Fuel Planner · Race Day Nutrition Card
                  </p>
                </div>
                <div className="text-right text-[10px] text-stone-500 leading-relaxed">
                  <div className="font-semibold">19 Jul 2025</div>
                  <div>82.0 km</div>
                  <div>↑2,800 m · ↓2,800 m</div>
                </div>
              </div>

              {/* ── 4-column metrics strip ──────────────────────────── */}
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {[
                  { value: "14h 30m", label: "Est. Duration",  color: "text-amber-800" },
                  { value: "60 g/hr",  label: "Carbs / hr",    color: "text-amber-800" },
                  { value: "500–650 ml", label: "Fluid / hr",  color: "text-blue-700"  },
                  { value: "High",     label: "Electrolytes",  color: "text-green-700" },
                ].map(({ value, label, color }) => (
                  <div key={label} className="text-center bg-amber-50 rounded p-1.5 border border-amber-100">
                    <div className={`text-[11px] font-bold ${color}`}>{value}</div>
                    <div className="text-[8px] text-stone-500 uppercase tracking-wide mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* ── Two-column body: Strategy + Items ──────────────── */}
              <div className="grid grid-cols-2 gap-2">

                {/* Strategy overview */}
                <div className="border border-stone-200 rounded p-2.5">
                  <div className="text-[8px] font-bold text-amber-700 uppercase tracking-wider mb-2 pb-1 border-b border-stone-200">
                    Strategy Overview
                  </div>
                  <table className="w-full text-[10px]">
                    <tbody className="[&>tr>td]:py-0.5">
                      <tr>
                        <td className="text-stone-500 w-[45%]">Carb target</td>
                        <td className="font-semibold">60 g/hr · 522g total</td>
                      </tr>
                      <tr>
                        <td className="text-stone-500">Primary fuels</td>
                        <td className="font-semibold">Gels + Chews</td>
                      </tr>
                      <tr>
                        <td className="text-stone-500">Drink mix</td>
                        <td className="font-semibold text-blue-700">3 sections</td>
                      </tr>
                      <tr>
                        <td className="text-stone-500">Fuel events</td>
                        <td className="font-semibold">41 scheduled</td>
                      </tr>
                      <tr>
                        <td className="text-stone-500">Checkpoints</td>
                        <td className="font-semibold">6 aid stations</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="mt-2 text-[9px] text-blue-700 bg-blue-50 rounded px-1.5 py-1">
                    💧 500–650 ml/hr · Warm conditions
                  </div>
                  <div className="mt-1 text-[9px] text-green-700 bg-green-50 rounded px-1.5 py-1">
                    ⚡ High sodium — electrolyte tabs recommended
                  </div>
                </div>

                {/* Total items required */}
                <div className="border border-stone-200 rounded p-2.5">
                  <div className="text-[8px] font-bold text-amber-700 uppercase tracking-wider mb-2 pb-1 border-b border-stone-200">
                    Total Items Required
                  </div>
                  {[
                    { type: "Gels", items: [{ name: "SIS Isotonic", qty: 10, carbs: "220g" }, { name: "SIS Caffeine", qty: 5, carbs: "110g" }] },
                    { type: "Chews", items: [{ name: "Torq Energy", qty: 6, carbs: "180g" }] },
                    { type: "Drink Mix", items: [{ name: "Maurten 320", qty: 3, carbs: "243g" }] },
                  ].map(({ type, items }) => (
                    <div key={type} className="mb-1.5">
                      <div className="text-[8px] font-bold text-amber-700 uppercase tracking-wide mb-0.5">{type}</div>
                      {items.map((item) => (
                        <div key={item.name} className="flex justify-between text-[10px]">
                          <span className="text-stone-700">{item.name}</span>
                          <span className="text-stone-500">×{item.qty} · {item.carbs}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Card footer ─────────────────────────────────────── */}
              <div className="pt-2 mt-2 border-t border-stone-200 flex justify-between text-[9px] text-stone-400">
                <span>Ultra Fuel Planner v2.31 · ultrafuelplanner.com</span>
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
                desc: "Your elevation profile tells the planner where the route gets hard — long climbs, technical descents, remote sections with no aid. Format recommendations adjust to what's practical on each terrain.",
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
            Build a practical race strategy from your own data and your actual
            course. Know what to carry, where fuelling gets harder, and what to
            restock at each checkpoint — before you toe the line.
          </p>
          <Link href="/planner">
            <Button size="lg" className="gap-2">
              Build your plan — it&apos;s free
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Structured data — SoftwareApplication schema ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Ultra Fuel Planner",
            applicationCategory: "SportsApplication",
            operatingSystem: "Web",
            url: "https://ultrafuelplanner.com",
            description:
              "Terrain-aware fuelling strategy planner for trail and ultramarathon runners. Upload a GPX route to generate carb targets, carry plans, and section-based nutrition guidance.",
            creator: {
              "@type": "Organization",
              name: "Ultra Fuel Planner",
              url: "https://ultrafuelplanner.com",
            },
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "GBP",
            },
            audience: {
              "@type": "Audience",
              audienceType:
                "Trail runners and ultramarathon athletes",
            },
            featureList: [
              "GPX route upload and terrain segmentation",
              "Terrain-aware fuelling schedule generation",
              "Carb target calculation from race duration and experience",
              "Section-by-section carry plan",
              "Aid station integration",
              "Printable race card",
            ],
          }),
        }}
      />
      <LegalFooter />
    </div>
  );
}
