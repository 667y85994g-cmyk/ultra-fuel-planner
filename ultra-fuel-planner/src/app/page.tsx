import Link from "next/link";
import {
  Mountain,
  Route,
  FlaskConical,
  MapPin,
  ChevronRight,
  Clock,
  Droplets,
  Zap,
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
              <Zap className="h-3 w-3" />
              Route-aware fuelling for ultras
            </div>

            <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-stone-50 md:text-6xl lg:text-7xl">
              Fuel your race.
              <br />
              <span className="text-amber-500">Not your anxiety.</span>
            </h1>

            <p className="mb-8 max-w-xl text-lg leading-relaxed text-stone-400">
              Upload your GPX route, add your fuel inventory, and get a
              practical race-day plan that adapts to your actual terrain — not
              generic hourly macros.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="/planner">
                <Button size="lg" className="gap-2">
                  Build my plan
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <span className="text-sm text-stone-500">
                No account required. Works in your browser.
              </span>
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
            Four steps from GPX to race card.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Route,
                step: "01",
                title: "Upload your route",
                desc: "Drop in a GPX file. The planner reads elevation, gradient and distance to understand what each section actually demands.",
              },
              {
                icon: FlaskConical,
                step: "02",
                title: "Add your fuel",
                desc: "Enter your gels, chews, drink mixes and real food. Each item knows whether it works on a steep climb or needs flat terrain.",
              },
              {
                icon: MapPin,
                step: "03",
                title: "Mark aid stations",
                desc: "Tell the planner where you can refill and restock. It calculates exactly what to carry between each one.",
              },
              {
                icon: Clock,
                step: "04",
                title: "Get your plan",
                desc: "A time-based, segment-aware schedule with rationale for every decision. Print it or carry it on your watch.",
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

      {/* What the planner knows */}
      <section className="border-t border-stone-800/60 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-3xl font-bold text-stone-50">
                The fuelling logic is terrain-aware
              </h2>
              <p className="mb-6 text-stone-400 leading-relaxed">
                Generic nutrition plans ignore the fact that you cannot chew a
                bar on a 25% gradient. This planner maps fuel format to terrain
                type so your schedule is actually executable on race day.
              </p>
              <ul className="space-y-3">
                {[
                  { terrain: "Steep climb", rule: "Liquids and gels only. No chewing." },
                  { terrain: "Technical descent", rule: "No fuelling prompts. Hands-free only." },
                  { terrain: "Flat and runnable", rule: "Best window for bars, chews, real food." },
                  { terrain: "Late race", rule: "Simplified to highest-tolerance options." },
                ].map((item) => (
                  <li key={item.terrain} className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                    <div>
                      <span className="text-sm font-medium text-stone-200">
                        {item.terrain}:{" "}
                      </span>
                      <span className="text-sm text-stone-400">{item.rule}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-stone-800 bg-stone-900/40 p-6">
              <h3 className="mb-4 font-semibold text-stone-200">
                Example plan output
              </h3>
              <div className="space-y-3 font-mono text-xs">
                {[
                  { time: "00:30", action: "1 gel (SIS Isotonic)", note: "Early race", color: "text-green-400" },
                  { time: "00:55", action: "200ml drink mix", note: "Stay hydrated", color: "text-blue-400" },
                  { time: "01:15", action: "1 chew pack", note: "Flat section", color: "text-green-400" },
                  { time: "01:40", action: "1 gel (not chews)", note: "Climb starts", color: "text-orange-400" },
                  { time: "01:45", action: "Drink 250ml", note: "High effort", color: "text-orange-400" },
                  { time: "02:10", action: "Aid station: refill 1.5L", note: "Restock 2 gels", color: "text-amber-400" },
                  { time: "06:30", action: "Banana (aid station)", note: "Late race — easy option", color: "text-stone-400" },
                ].map((row, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 rounded-md px-3 py-2 ${
                      i % 2 === 0 ? "bg-stone-800/40" : ""
                    }`}
                  >
                    <span className="w-12 flex-shrink-0 text-stone-500">
                      {row.time}
                    </span>
                    <span className={`flex-1 ${row.color}`}>{row.action}</span>
                    <span className="flex-shrink-0 text-stone-600 text-right">
                      {row.note}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Targets overview */}
      <section className="border-t border-stone-800/60 bg-stone-950 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-2 text-center text-3xl font-bold text-stone-50">
            Three targets. Every hour.
          </h2>
          <p className="mb-14 text-center text-stone-400">
            Carbs, fluid and sodium tracked across every segment of your race.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Zap,
                label: "Carbohydrate",
                value: "60–90g/hr",
                desc: "Matched to your training gut capacity. Mixed carb sources for high targets.",
                color: "text-amber-400",
                bg: "bg-amber-900/20",
              },
              {
                icon: Droplets,
                label: "Fluid",
                value: "500–800ml/hr",
                desc: "Adjusted upward on climbs and hot sections. Carry plan calculated per section.",
                color: "text-blue-400",
                bg: "bg-blue-900/20",
              },
              {
                icon: FlaskConical,
                label: "Sodium",
                value: "500–1000mg/hr",
                desc: "Based on sweat rate and fluid intake. Capsules or drink mix top-ups included.",
                color: "text-green-400",
                bg: "bg-green-900/20",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-stone-800 bg-stone-900/40 p-6 text-center"
              >
                <div
                  className={`mx-auto mb-4 w-fit rounded-full ${item.bg} p-3`}
                >
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <div className={`mb-1 text-2xl font-bold ${item.color}`}>
                  {item.value}
                </div>
                <div className="mb-3 font-semibold text-stone-200">
                  {item.label}
                </div>
                <p className="text-sm text-stone-400 leading-relaxed">{item.desc}</p>
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
            Build a practical plan now. Know your carry weights, your aid
            station targets and your terrain-specific strategy before you toe
            the line.
          </p>
          <Link href="/planner">
            <Button size="lg">
              Start planning — it&apos;s free
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
            Ultra Fuel Planner — built for runners who take execution seriously.
          </div>
        </div>
      </footer>
    </div>
  );
}
