import Link from "next/link";
import TopographyLines from "@/components/TopographyLines";

export const metadata = {
  title: "The Doctrine — Trail Hustle",
  description:
    "Core belief, principles, what we reject. The philosophical foundation of Trail Hustle.",
};

export default function DoctrinePage() {
  return (
    <>
      {/* ─── HERO ────────────────────────────────────────────── */}
      <section className="relative bg-th-black min-h-[60vh] flex items-end overflow-hidden pt-32">
        <TopographyLines color="white" opacity={0.08} lineCount={18} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 w-full">
          <p className="th-label text-white/40 mb-6">Part 01</p>
          <h1
            className="text-th-white"
            style={{
              fontFamily: '"Cal Sans", system-ui, sans-serif',
              fontSize: "clamp(3rem, 8vw, 7rem)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            The
            <br />
            Doctrine.
          </h1>
          <p className="text-white/50 font-body mt-4 text-sm tracking-widest uppercase">
            Philosophical Foundation
          </p>
        </div>
      </section>

      {/* ─── CORE BELIEF ─────────────────────────────────────── */}
      <section className="bg-th-white py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-20 items-start">
            <div>
              <p className="th-label mb-8">Core Belief</p>

              {/* Window device */}
              <div className="border border-th-black/20 p-8 mb-12">
                <div className="grid grid-cols-3 gap-0 text-center">
                  {[
                    { place: "Work", trains: "competence." },
                    { place: "Home", trains: "responsibility." },
                    { place: "The third place", trains: "capacity." },
                  ].map((item, i) => (
                    <div
                      key={item.place}
                      className={`py-6 px-4 ${i < 2 ? "border-r border-th-black/15" : ""}`}
                    >
                      <p className="text-xs tracking-widest uppercase text-th-black/40 mb-2 font-body">
                        {item.place}
                      </p>
                      <p
                        className={`font-body text-sm ${i === 2 ? "text-burnt-ochre font-semibold" : "text-th-black/70"}`}
                      >
                        trains {item.trains}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p className="text-th-black font-body text-lg leading-relaxed mb-6">
                Most ambitious professionals plateau not from lack of effort but
                from lack of exposure. They train hard at work. They carry
                responsibility at home. Neither environment reliably produces the
                conditions required for step-change growth.
              </p>
              <p className="text-th-black/70 font-body leading-relaxed mb-6">
                The conditions required: genuine uncertainty, physical hardship,
                peer accountability without professional hierarchy, and the forced
                introspection that follows voluntary suffering.
              </p>
              <p className="text-th-black font-body leading-relaxed">
                Trail Hustle exists to close this gap. It is a structured training
                ground that uses physical challenge and shared hardship as
                instruments for expanding human capacity — the kind that compounds
                across leadership, relationships, and decision-making under pressure.
              </p>
              <div className="mt-10 pt-8 border-t border-th-black/10">
                <p
                  className="text-2xl text-th-black"
                  style={{ fontFamily: '"Cal Sans", system-ui, sans-serif' }}
                >
                  This is not wellness.
                </p>
                <p
                  className="text-lg text-burnt-ochre mt-2"
                  style={{ fontFamily: '"Cal Sans", system-ui, sans-serif' }}
                >
                  This is deliberate preparation for a harder life, voluntarily chosen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DOCTRINAL PRINCIPLES ────────────────────────────── */}
      <section className="relative bg-th-black py-28 overflow-hidden">
        <TopographyLines color="white" opacity={0.05} lineCount={12} />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <p className="th-label text-white/40 mb-16">Doctrinal Principles</p>

          <div className="grid md:grid-cols-2 gap-px bg-white/5">
            {[
              {
                n: "01",
                title: "Discomfort is data.",
                body: "Comfortable environments produce stable performance. Unstable environments produce adaptation. The nervous system does not consolidate growth in the absence of productive stress. If nothing is hard, nothing is changing.",
              },
              {
                n: "02",
                title: "The body is the entry point, not the destination.",
                body: "Physical challenge is the most reliable method for stripping away role identity, social performance, and cognitive defence. What remains underneath is more honest, and more usable.",
              },
              {
                n: "03",
                title: "Shared hardship creates trust faster than shared success.",
                body: "People reveal themselves under load. The relationships formed in effort — where no one can fake composure — are structurally different from those formed in boardrooms or networking events.",
              },
              {
                n: "04",
                title: "Reflection is the mechanism, not the metaphor.",
                body: "Exertion without integration produces fitness. Exertion with deliberate integration produces capacity. The debrief is not optional. It is where the training occurs.",
              },
              {
                n: "05",
                title: "Peer selection is a competitive advantage.",
                body: "The quality of the people you suffer alongside determines the quality of what you carry home. Membership standards exist to protect the signal, not to exclude — but the two are not separable.",
              },
              {
                n: "06",
                title: "Progress must be made legible.",
                body: "Invisible growth does not compound. Trail Hustle tracks member progression explicitly — physical, psychological, relational — so members can see what they are building and why it matters.",
              },
              {
                n: "07",
                title: "This is not therapy, retreating, or recovering.",
                body: "Trail Hustle is not for people who need fixing. It is for people who want more range. The direction is expansion, not repair. High performers do not need reassurance — they need challenge.",
              },
            ].map((p) => (
              <div
                key={p.n}
                className="bg-th-black p-10 hover:bg-white/5 transition-colors duration-300"
              >
                <span className="text-burnt-ochre text-xs tracking-widest font-body mb-5 block">
                  {p.n}
                </span>
                <h3
                  className="text-th-white mb-4"
                  style={{
                    fontFamily: '"Cal Sans", system-ui, sans-serif',
                    fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
                    lineHeight: 1.2,
                  }}
                >
                  {p.title}
                </h3>
                <p className="text-white/55 font-body text-sm leading-relaxed">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHAT WE REJECT ──────────────────────────────────── */}
      <section className="bg-th-white py-28">
        <div className="max-w-7xl mx-auto px-6">
          <p className="th-label mb-16">What Trail Hustle Rejects</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              {
                title: "Wellness as identity performance",
                body: "Optimising for how recovery looks, not what it builds.",
              },
              {
                title: "Comfort as the goal",
                body: "Comfort is the output of a life well-trained, not the input. Pursuing it directly produces neither.",
              },
              {
                title: "Networking disguised as community",
                body: "Transactional proximity is not belonging. Neither is a shared Strava segment.",
              },
              {
                title: "Generic leadership frameworks",
                body: "Resilience is not a slide deck competency. It is a physiological and psychological reality.",
              },
              {
                title: "Events without doctrine",
                body: "An endurance event without a framework for integration is just a race. We are not a race company.",
              },
              {
                title: "Growth without accountability",
                body: "Self-reported progress is not progress. We measure, track, and hold members to what they said they wanted.",
              },
            ].map((item) => (
              <div key={item.title} className="border-t border-th-black/15 pt-8">
                <h3
                  className="text-th-black mb-3"
                  style={{
                    fontFamily: '"Cal Sans", system-ui, sans-serif',
                    fontSize: "1.15rem",
                    lineHeight: 1.2,
                  }}
                >
                  {item.title}
                </h3>
                <p className="text-th-black/60 font-body text-sm leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRANSFER MECHANISM ──────────────────────────────── */}
      <section className="bg-sandstone/15 py-28 border-y border-th-black/10">
        <div className="max-w-7xl mx-auto px-6">
          <p className="th-label mb-6">The Transfer Mechanism</p>
          <p
            className="text-th-black max-w-3xl mb-16"
            style={{
              fontFamily: '"Cal Sans", system-ui, sans-serif',
              fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)",
              lineHeight: 1.3,
            }}
          >
            Physical challenge under structured adversity produces observable
            changes in how people perform, decide, and relate under pressure.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Leadership Capacity",
                color: "text-burnt-ochre",
                body: "Sustained aerobic effort under fatigue forces decision-making under degraded cognitive resources — the exact conditions of senior leadership. Repeated exposure builds the capacity for consistent performance when conditions are adverse.",
              },
              {
                title: "Emotional Regulation",
                color: "text-forest-green",
                body: "Physical hardship creates a temporary but intense state of emotional exposure. Members who complete difficult challenges with group support build the ability to stay task-effective without avoidance when emotionally uncomfortable.",
              },
              {
                title: "Stress Tolerance",
                color: "text-ocean-slate",
                body: "Behavioural proof — not biomarkers. We track attendance consistency under professional load, task completion rates during high-stress periods, and self-reported deltas at intake, 3 months, and 6 months.",
              },
              {
                title: "Relational Presence",
                color: "text-clay-red",
                body: "Physical challenge eliminates the cognitive bandwidth available for social performance. Members are forced into the present: tired, honest, and without professional armour. These conditions produce authentic disclosure.",
              },
            ].map((item) => (
              <div key={item.title}>
                <h3
                  className={`${item.color} mb-4`}
                  style={{
                    fontFamily: '"Cal Sans", system-ui, sans-serif',
                    fontSize: "1.25rem",
                    lineHeight: 1.2,
                  }}
                >
                  {item.title}
                </h3>
                <p className="text-th-black/65 font-body text-sm leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────── */}
      <section className="relative bg-th-black py-28 overflow-hidden">
        <TopographyLines color="white" opacity={0.06} lineCount={10} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <h2
            className="text-th-white mb-8"
            style={{
              fontFamily: '"Cal Sans", system-ui, sans-serif',
              fontSize: "clamp(2rem, 5vw, 4rem)",
              lineHeight: 1.1,
            }}
          >
            The doctrine is defensible.
            <br />
            The standards are the product.
          </h2>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link href="/apply" className="th-btn-primary">
              Begin Application →
            </Link>
            <Link href="/training" className="th-btn-ghost-light">
              View Training Ground
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
