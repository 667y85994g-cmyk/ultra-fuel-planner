import Link from "next/link";
import {
  Mountain,
  Route,
  FlaskConical,
  MapPin,
  ChevronRight,
  Clock,
  Zap,
  Activity,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-stone-800/60 bg-stone-950/80 backdrop-blur-sm">
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
      <section className="relative overflow-hidden pt-24">
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
              Upload your GPX, add your past run data and the fuel you plan to
              carry. The planner builds a practical race-day fuelling plan —
              terrain by terrain, aid station to aid station.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="/planner">
                <Button size="lg" className="gap-2">
                  Build your plan
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <span className="text-sm text-stone-500">
                No account required. No physiology jargon. Just a practical race plan.
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
            Three questions every ultra runner needs to answer before race day.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "How much fuel to aim for",
                desc: "A realistic carb target based on your past runs, event length and the demands of the route.",
                color: "text-amber-400",
                bg: "bg-amber-900/20",
              },
              {
                icon: Mountain,
                title: "When fuelling will be hardest",
                desc: "Climbs, technical terrain and long gaps between aid stations change what you can realistically eat and drink.",
                color: "text-orange-400",
                bg: "bg-orange-900/20",
              },
              {
                icon: Package,
                title: "What to actually carry",
                desc: "Build a plan using the gels, drink mixes and food you'll have on race day. Know your carry weight between each checkpoint.",
                color: "text-blue-400",
                bg: "bg-blue-900/20",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-stone-800 bg-stone-900/40 p-6"
              >
                <div
                  className={`mb-4 w-fit rounded-full ${item.bg} p-3`}
                >
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-stone-100">
                  {item.title}
                </h3>
                <p className="text-sm text-stone-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Race card preview */}
      <section className="border-t border-stone-800/60 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2 items-start">
            <div>
              <h2 className="mb-4 text-3xl font-bold text-stone-50">
                See the race plan before you start.
              </h2>
              <p className="mb-6 text-stone-400 leading-relaxed">
                The planner produces a simple race card you can print and carry
                on the day. It tells you what to eat, when to eat it, and what
                terrain to expect — so you can focus on running.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  { label: "Fuelling schedule", detail: "What to eat at each point, matched to the terrain." },
                  { label: "Carry plan", detail: "What to pack between each aid station, with approximate fluid needs." },
                  { label: "Terrain segments", detail: "Climbs, descents and flat sections — so you know what's coming." },
                  { label: "Hydration guidance", detail: "A practical drinking range, not a false-precision number." },
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

            {/* Mock race card */}
            <div className="rounded-xl border border-stone-700 bg-white p-5 text-stone-900 shadow-2xl shadow-black/40">
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

              {/* Mini summary strip */}
              <div className="grid grid-cols-3 gap-2 mb-4 bg-amber-50 rounded-md p-3">
                <div className="text-center">
                  <div className="text-sm font-bold text-amber-800">14h 30m</div>
                  <div className="text-[9px] text-stone-500 uppercase">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-amber-800">65g</div>
                  <div className="text-[9px] text-stone-500 uppercase">Carbs/hr</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-blue-700">450–650 ml/hr</div>
                  <div className="text-[9px] text-stone-500 uppercase">Hydration</div>
                </div>
              </div>

              {/* Mini schedule */}
              <div className="mb-4">
                <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Fuelling schedule
                </p>
                <div className="space-y-0 text-[11px]">
                  {[
                    { time: "00:40", km: "6.2", action: "1 gel (SIS Isotonic)", terrain: "Rolling", carbs: "22g", color: "text-green-700" },
                    { time: "01:15", km: "11.0", action: "1 chew pack", terrain: "Flat", carbs: "24g", color: "text-green-700" },
                    { time: "01:55", km: "16.8", action: "1 gel (Maurten 100)", terrain: "Climb", carbs: "25g", color: "text-orange-700" },
                    { time: "02:30", km: "22.1", action: "Aid station: restock", terrain: "—", carbs: "—", color: "text-amber-700" },
                    { time: "03:10", km: "27.5", action: "1 gel + drink mix", terrain: "Rolling", carbs: "42g", color: "text-green-700" },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded ${
                        row.terrain === "—" ? "bg-amber-50" : i % 2 === 0 ? "bg-stone-50" : ""
                      }`}
                    >
                      <span className="w-8 flex-shrink-0 font-mono text-stone-400">{row.time}</span>
                      <span className="w-7 flex-shrink-0 text-stone-400">{row.km}</span>
                      <span className={`flex-1 ${row.color} font-medium`}>{row.action}</span>
                      <span className="w-10 text-right text-amber-800 font-medium">{row.carbs}</span>
                    </div>
                  ))}
                  <div className="px-2 pt-1 text-[10px] text-stone-400 italic">
                    ...continues for full race
                  </div>
                </div>
              </div>

              {/* Mini carry plan */}
              <div className="bg-stone-50 rounded-md p-3">
                <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Carry plan — Start to CP1
                </p>
                <div className="flex gap-4 text-[11px]">
                  <span className="text-blue-700 font-medium">~1.5L fluid</span>
                  <span className="text-amber-800 font-medium">110g carbs</span>
                  <span className="text-stone-500">3 gels, 1 chew, 1 drink mix</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-stone-200 flex justify-between text-[9px] text-stone-400">
                <span>Ultra Fuel Planner v1.6</span>
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

      {/* Terrain awareness */}
      <section className="border-t border-stone-800/60 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold text-stone-50">
            It knows you can&apos;t eat a bar on a 25% gradient.
          </h2>
          <p className="mb-10 text-center text-stone-400 leading-relaxed max-w-2xl mx-auto">
            The planner matches fuel format to terrain. Gels on climbs. Solids
            on flats. Simplified options when you&apos;re deep into the race.
            No fuelling prompts on technical descents.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { terrain: "Steep climb", rule: "Gels and liquids only — no chewing" },
              { terrain: "Technical descent", rule: "Hands-free. No fuelling prompts" },
              { terrain: "Flat and runnable", rule: "Best window for bars, chews and real food" },
              { terrain: "Long gaps between aid", rule: "Carry plan adjusted to cover the distance" },
              { terrain: "Late race", rule: "Simplified to your highest-tolerance options" },
              { terrain: "Warm conditions", rule: "Hydration range increases automatically" },
            ].map((item) => (
              <div
                key={item.terrain}
                className="rounded-lg border border-stone-800 bg-stone-900/30 px-4 py-3"
              >
                <span className="text-sm font-medium text-stone-200">
                  {item.terrain}
                </span>
                <p className="mt-0.5 text-xs text-stone-500">{item.rule}</p>
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

      {/* Footer */}
      <footer className="border-t border-stone-800/60 py-8">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-500 text-sm">
            <Mountain className="h-4 w-4" />
            Ultra Fuel Planner — route-aware fuelling for trail and ultra runners.
          </div>
          <span className="text-xs text-stone-600">v1.6</span>
        </div>
      </footer>
    </div>
  );
}
