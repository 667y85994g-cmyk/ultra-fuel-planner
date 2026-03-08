import Link from "next/link";
import TopographyLines from "@/components/TopographyLines";

export default function Home() {
  return (
    <>
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen bg-th-black flex flex-col justify-end overflow-hidden">
        <TopographyLines color="white" opacity={0.07} lineCount={22} />

        {/* Subtle earth-tone gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-burnt-ochre/10 via-transparent to-ocean-slate/10 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 pt-40">
          {/* Section label */}
          <p className="th-label text-white/50 mb-8">
            The Third Place · UK
          </p>

          {/* Main heading */}
          <h1
            className="text-white mb-8"
            style={{
              fontFamily: '"Cal Sans", system-ui, sans-serif',
              fontSize: "clamp(3.5rem, 10vw, 9rem)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            Trail
            <br />
            Hustle.
          </h1>

          {/* Tagline */}
          <p
            className="text-white/70 mb-12 max-w-lg"
            style={{
              fontFamily: '"Cal Sans", system-ui, sans-serif',
              fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
            }}
          >
            This is where the hustle meets the horizon.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <Link href="/apply" className="th-btn-primary">
              Apply Now →
            </Link>
            <Link href="/doctrine" className="th-btn-ghost-light">
              Read the Doctrine
            </Link>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-th-black/40 to-transparent pointer-events-none" />
      </section>

      {/* ─── THREE PLACES ────────────────────────────────────── */}
      <section className="bg-th-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-0 border border-th-black/10">
            {[
              {
                place: "Work",
                trains: "competence.",
                bg: "bg-th-white",
                text: "text-th-black",
              },
              {
                place: "Home",
                trains: "responsibility.",
                bg: "bg-sandstone/20",
                text: "text-th-black",
              },
              {
                place: "The third place",
                trains: "capacity.",
                bg: "bg-th-black",
                text: "text-th-white",
                highlight: true,
              },
            ].map((item) => (
              <div
                key={item.place}
                className={`${item.bg} ${item.text} p-12 border-b md:border-b-0 md:border-r border-th-black/10 last:border-0`}
              >
                <p
                  className="text-xs tracking-widest uppercase mb-6 opacity-50 font-body"
                >
                  {item.place}
                </p>
                <p
                  style={{
                    fontFamily: '"Cal Sans", system-ui, sans-serif',
                    fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                    lineHeight: 1.1,
                  }}
                >
                  trains
                  <br />
                  <span className={item.highlight ? "text-sandstone" : "text-burnt-ochre"}>
                    {item.trains}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── THE ETHOS ───────────────────────────────────────── */}
      <section className="bg-th-white py-24 border-t border-th-black/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl">
            <p className="th-label mb-8">The Ethos</p>
            <blockquote
              style={{
                fontFamily: '"Cal Sans", system-ui, sans-serif',
                fontSize: "clamp(1.75rem, 4vw, 3rem)",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
              }}
              className="text-th-black mb-12"
            >
              Trail Hustle is where people reconnect. With the earth, with each
              other, and with themselves. It&apos;s not about stepping away from
              ambition. It&apos;s about stepping into something deeper.
            </blockquote>
            <p className="text-th-black/60 font-body text-lg leading-relaxed max-w-2xl">
              We move hard, think big, and breathe in what matters.
            </p>
          </div>
        </div>
      </section>

      {/* ─── DRIVE. DEPTH. DISCOVERY. ────────────────────────── */}
      <section className="relative bg-th-black py-28 overflow-hidden">
        <TopographyLines color="white" opacity={0.05} lineCount={15} />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <p className="th-label text-white/40 mb-16">What it stands for</p>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: "Drive.",
                color: "text-burnt-ochre",
                body: "We're fuelled by a desire to grow, to connect, and to do things with meaning. Whether it's building a business, running a retreat, or pushing a personal limit — what matters is the intent behind the action. This is about showing up with purpose, individually and together.",
              },
              {
                title: "Depth.",
                color: "text-sandstone",
                body: "In a world that moves fast and talks loud, we make space for what's real. Conversations that matter, experiences that stay with you, and relationships built on something stronger than networking. We choose to slow down and tune in.",
              },
              {
                title: "Discovery.",
                color: "text-ocean-slate",
                body: "We believe in staying curious. In asking better questions. In getting out of our comfort zones and into places, and mindsets, that expand who we are. Sometimes that means 100km at your best ever pace. Sometimes it's a weekend spent breathing it all in.",
              },
            ].map((item) => (
              <div key={item.title}>
                <h2
                  className={`${item.color} mb-6`}
                  style={{
                    fontFamily: '"Cal Sans", system-ui, sans-serif',
                    fontSize: "clamp(2rem, 4vw, 3.5rem)",
                    lineHeight: 1,
                  }}
                >
                  {item.title}
                </h2>
                <p className="text-white/60 font-body leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── THIS IS NOT WELLNESS ────────────────────────────── */}
      <section className="bg-th-white py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="th-label mb-8">The Doctrine</p>
              <h2
                style={{
                  fontFamily: '"Cal Sans", system-ui, sans-serif',
                  fontSize: "clamp(2rem, 5vw, 4rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
                className="mb-8"
              >
                This is not wellness.
              </h2>
              <p className="text-th-black/70 font-body text-lg leading-relaxed mb-10">
                This is deliberate preparation for a harder life, voluntarily
                chosen. Trail Hustle exists to close the gap between where
                ambitious professionals are, and where they are capable of
                becoming.
              </p>
              <Link href="/doctrine" className="th-btn-primary">
                Read the Doctrine →
              </Link>
            </div>

            <div className="space-y-1">
              {[
                "Discomfort is data.",
                "The body is the entry point, not the destination.",
                "Shared hardship creates trust faster than shared success.",
                "Reflection is the mechanism, not the metaphor.",
                "Peer selection is a competitive advantage.",
                "Progress must be made legible.",
              ].map((principle, i) => (
                <div
                  key={principle}
                  className="flex items-start gap-4 py-5 border-b border-th-black/10 last:border-0"
                >
                  <span className="text-xs text-burnt-ochre font-body tracking-widest mt-1 shrink-0">
                    0{i + 1}
                  </span>
                  <p
                    className="text-th-black font-body leading-snug"
                    style={{ fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)" }}
                  >
                    {principle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRAINING GROUND PREVIEW ──────────────────────────── */}
      <section className="bg-th-black py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <p className="th-label text-white/40 mb-4">The Training Ground</p>
              <h2
                style={{
                  fontFamily: '"Cal Sans", system-ui, sans-serif',
                  fontSize: "clamp(2rem, 4vw, 3.5rem)",
                  lineHeight: 1.05,
                }}
                className="text-th-white"
              >
                Three tiers.
                <br />
                One standard.
              </h2>
            </div>
            <Link href="/training" className="th-btn-ghost-light shrink-0">
              View Training Ground →
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-white/10">
            {[
              {
                name: "Entry Track",
                subtitle: "The qualification pathway",
                price: "£79–99",
                period: "/ month",
                color: "bg-ocean-slate/20",
                features: [
                  "Monthly group challenge events",
                  "Trail runs, hill days, open water",
                  "15-min post-session debrief",
                  "Digital training platform",
                  "Performance assessed at 3 months",
                ],
              },
              {
                name: "Core",
                subtitle: "The training ground",
                price: "£179–249",
                period: "/ month",
                color: "bg-burnt-ochre/20",
                features: [
                  "Everything in Entry, plus:",
                  "Assigned cohort of 8–12 peers",
                  "Quarterly immersive weekend",
                  "Progression tracking — physical & psychological",
                  "Member directory with warm introductions",
                ],
              },
              {
                name: "Advanced",
                subtitle: "The edge",
                price: "£249–299",
                period: "/ month",
                color: "bg-forest-green/20",
                features: [
                  "Everything in Core, plus:",
                  "Quarterly 1:1 integration coaching",
                  "Leadership capacity assessment",
                  "Priority access to executive-only cohorts",
                  "Expeditions priced separately — gated access",
                ],
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`${tier.color} bg-th-black p-10 flex flex-col`}
              >
                <div className="mb-auto">
                  <p className="th-label text-white/40 mb-3">{tier.subtitle}</p>
                  <h3
                    style={{
                      fontFamily: '"Cal Sans", system-ui, sans-serif',
                      fontSize: "1.75rem",
                    }}
                    className="text-th-white mb-6"
                  >
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span
                      className="text-sandstone"
                      style={{
                        fontFamily: '"Cal Sans", system-ui, sans-serif',
                        fontSize: "2rem",
                      }}
                    >
                      {tier.price}
                    </span>
                    <span className="text-white/40 text-sm font-body">
                      {tier.period}
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <span className="text-burnt-ochre mt-0.5 shrink-0">—</span>
                        <span className="text-white/70 text-sm font-body leading-snug">
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHAT WE REJECT ──────────────────────────────────── */}
      <section className="bg-sandstone/15 py-24 border-y border-th-black/10">
        <div className="max-w-7xl mx-auto px-6">
          <p className="th-label mb-12">What Trail Hustle rejects</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                reject: "Wellness as identity performance",
                detail:
                  "Optimising for how recovery looks, not what it builds.",
              },
              {
                reject: "Networking disguised as community",
                detail:
                  "Transactional proximity is not belonging. Neither is a shared Strava segment.",
              },
              {
                reject: "Events without doctrine",
                detail:
                  "An endurance event without a framework for integration is just a race. We are not a race company.",
              },
              {
                reject: "Comfort as the goal",
                detail:
                  "Comfort is the output of a life well-trained, not the input.",
              },
              {
                reject: "Generic leadership frameworks",
                detail:
                  "Resilience is not a slide deck competency. It is a physiological and psychological reality.",
              },
              {
                reject: "Growth without accountability",
                detail:
                  "Self-reported progress is not progress. We measure, track, and hold members to what they said they wanted.",
              },
            ].map((item) => (
              <div key={item.reject} className="py-2">
                <div className="w-8 h-px bg-burnt-ochre mb-5" />
                <h3
                  className="text-th-black mb-3"
                  style={{
                    fontFamily: '"Cal Sans", system-ui, sans-serif',
                    fontSize: "1.1rem",
                    lineHeight: 1.2,
                  }}
                >
                  {item.reject}
                </h3>
                <p className="text-th-black/60 font-body text-sm leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── APPLICATION CTA ─────────────────────────────────── */}
      <section className="relative bg-th-black py-32 overflow-hidden">
        <TopographyLines color="white" opacity={0.06} lineCount={14} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          {/* Window device */}
          <div className="inline-block border border-sandstone/40 px-8 py-3 mb-12">
            <p className="text-sandstone text-xs tracking-widest uppercase font-body">
              Standards apply from session one
            </p>
          </div>

          <h2
            className="text-th-white mb-8 mx-auto"
            style={{
              fontFamily: '"Cal Sans", system-ui, sans-serif',
              fontSize: "clamp(2.5rem, 7vw, 6rem)",
              lineHeight: 1,
              maxWidth: "14ch",
            }}
          >
            The application is the first test.
          </h2>

          <p className="text-white/60 font-body text-lg mb-14 mx-auto max-w-xl leading-relaxed">
            This is not a sign-up. Membership requires a written application,
            two paid trial sessions, and a screening call. Acceptance is not
            guaranteed.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apply" className="th-btn-primary">
              Begin Application →
            </Link>
            <Link href="/training" className="th-btn-ghost-light">
              View Tiers & Pricing
            </Link>
          </div>

          <p className="text-white/30 font-body text-xs tracking-wide mt-10">
            Grounded. Connected. Present. Driven. Focused. Evolving.
          </p>
        </div>
      </section>
    </>
  );
}
