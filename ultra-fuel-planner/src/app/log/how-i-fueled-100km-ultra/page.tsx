import type { Metadata } from "next";
import Link from "next/link";
import { Mountain, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LegalFooter } from "@/components/LegalFooter";

export const metadata: Metadata = {
  title: "How I Fueled a 100km Ultra Marathon",
  description:
    "Race to the Stones in 33°C heat, 18 hours, and finished strong. Here's the fuelling approach that made the difference — and why it led to building Ultra Fuel Planner.",
  alternates: {
    canonical: "https://ultrafuelplanner.com/log/how-i-fueled-100km-ultra",
  },
  openGraph: {
    title: "How I Fueled a 100km Ultra Marathon | Ultra Fuel Planner",
    description:
      "Race to the Stones in 33°C heat, 18 hours, and finished strong. Here's the fuelling approach that made the difference — and why it led to building Ultra Fuel Planner.",
    url: "https://ultrafuelplanner.com/log/how-i-fueled-100km-ultra",
    type: "article",
  },
};

function InlineCTA() {
  return (
    <div className="my-10 rounded-xl border border-amber-800/30 bg-amber-900/10 px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
      <p className="text-sm text-stone-300 leading-relaxed">
        Planning your own race? Build a fuelling plan around your route and your data.
      </p>
      <Link href="/planner" className="flex-shrink-0">
        <Button size="sm" className="gap-1.5">
          Plan your own race
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
}

function EndCTA() {
  return (
    <div className="mt-14 rounded-xl border border-amber-800/40 bg-amber-900/15 px-6 py-6">
      <p className="text-base font-semibold text-stone-100 mb-1">
        Build your fuelling plan
      </p>
      <p className="text-sm text-stone-400 mb-4 leading-relaxed">
        Upload your GPX route, add your training data, and generate a plan you can actually follow on race day.
      </p>
      <Link href="/planner">
        <Button className="gap-1.5">
          Start planning
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}

export default function ArticlePage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 w-full border-b border-stone-800/60 bg-stone-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-stone-400 hover:text-stone-200 transition-colors"
            >
              <Mountain className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Ultra Fuel Planner</span>
            </Link>
            <span className="text-stone-700 hidden sm:block">/</span>
            <Link
              href="/log"
              className="hidden sm:flex items-center gap-1 text-sm text-stone-500 hover:text-stone-300 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              The Log
            </Link>
          </div>
          <Link href="/planner">
            <Button size="sm" className="gap-1.5">
              Build your plan
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Article */}
      <article className="flex-1 mx-auto w-full max-w-2xl px-6 py-14 md:py-20">
        {/* Header */}
        <header className="mb-12">
          <div className="mb-5 flex items-center gap-3 text-xs text-stone-500">
            <Link href="/log" className="hover:text-stone-300 transition-colors">
              The Log
            </Link>
            <span>·</span>
            <span>March 2026</span>
            <span>·</span>
            <span>7 min read</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-stone-50 leading-tight">
            How I Fueled a 100km Ultra (and Why I Built Ultra Fuel Planner After)
          </h1>
        </header>

        {/* Body */}
        <div className="space-y-6 text-stone-300 text-[17px] leading-[1.8]">

          <p>
            At 8:30am on a July morning in 2025, already warmer than it had any right to be (you had to be there!), I set off at Race to the Stones. It&apos;s one of those routes that looks gentle on paper — rolling chalk trails, open fields, wide skies… by the middle of the day it was pushing 33°C, and there wasn&apos;t much shade to hide in and it was bouncing up off the floor!
          </p>

          <p>
            It took me 18 hours to get round — I hadn&apos;t set out for a time and the heat definitely slowed me down. I picked up blisters around 40km and spent most of the following week walking like I&apos;d borrowed someone else&apos;s feet. And yet, somehow, I finished feeling good. Not fresh in any normal sense, but clear, steady, still in control of myself.
          </p>

          <p>
            A few people asked me afterwards how that was possible and on reflection I know it was that I had got my fuelling right. I&apos;ve done plenty of endurance events, including the Devizes to Westminster Canoe Race, 24-hour hikes, and other ultra marathons. I had learned from a lot of experience that without being intentional about fuelling and hydration that I would just bonk. I&apos;ve had my share of DNFs and I was determined this was not going to be another.
          </p>

          <InlineCTA />

          <p>
            Most people assume ultras are about fitness, and of course that matters. But it&apos;s not what decides your day. What really matters is whether you can keep your system working when everything is slowly trying to shut down. Your glycogen is limited, your appetite fades, and at some point even the idea of eating becomes unappealing. That&apos;s where races unravel.
          </p>

          <p>
            Not with a dramatic collapse, but with a quiet drift. You miss a feed, then another, and before long you&apos;re trying to use Jelly Babies to recover from a deficit that&apos;s been building for hours. I&apos;d had enough long runs where that had happened to me, and I didn&apos;t want to spend another race guessing.
          </p>

          <p>
            So I simplified things.
          </p>

          <p>
            In my training I relied on Maurten gels, bars and drink mix, and I repeated the same pattern throughout race day. Every 10km I&apos;d see my support crew, swap bottles, take on what I needed and keep moving. There was no real variety and no decision-making at aid stations. I wasn&apos;t trying to be clever in the moment. I just wanted something predictable that my body could tolerate and that I could stick to without thinking.
          </p>

          <p>
            That consistency turned out to be far more valuable than having options, but that simplicity on the day came from a bit of thinking beforehand.
          </p>

          <p>
            In the weeks leading into the race, I&apos;d spent some time looking back over my long runs using Garmin, WHOOP and Strava. Not in a particularly technical way, but enough to understand what I was actually burning at the effort level I tend to sit at, rather than just relying on pace or generic race calculators. Effort tells a truer story, especially on trails.
          </p>

          <p>
            From that, I built something I could follow without having to think too much about it.
          </p>

          <p>
            I set three simple prompts on my watch. Every 15 minutes, I drank — aiming for 1L per hour given the heat and half:half with electrolytes. Every time I&apos;d burned roughly 300 calories, I took on fuel. And if my heart rate crept above 145, I eased off to stay around my aerobic threshold. They weren&apos;t there to optimise anything. They were there to stop me drifting. Those prompts kept me honest. They kept me eating early, drinking consistently, and staying within myself even when the day started to bite.
          </p>

          <p>
            Looking back, what stands out most is what didn&apos;t happen. I never really hit a wall. There wasn&apos;t a point where everything fell apart or where I felt like I was hanging on. The blisters slowed me down, but they didn&apos;t define the day. Energy-wise I stayed steady, and that changed the whole experience.
          </p>

          <p>
            Afterwards, I kept coming back to the same thought. None of what I&apos;d done was especially complex, but it also wasn&apos;t obvious. It came from taking my own data, understanding the effort I was actually running at, and turning that into something simple enough to follow when I wasn&apos;t thinking clearly.
          </p>

          <p>
            That&apos;s the gap most novice endurance folk fall into. They either follow generic advice, or they try to wing it on the day.
          </p>

          <p>
            That was really the starting point for Ultra Fuel Planner.
          </p>

          <p>
            Not as something clever, but as something practical. A way to take a route, use data from your previous runs, and turn that into a plan you can actually follow when you&apos;re deep into a race and not thinking straight.
          </p>

          <p>
            If you&apos;re heading into your own ultra, I wouldn&apos;t overcomplicate it. Start eating earlier than feels necessary. Keep things simple enough that you can repeat them all day. Stay on top of hydration rather than reacting to it. And practise it until it feels normal, because race day is not the place to be figuring it out.
          </p>

          <p>
            Finishing an ultra feeling good isn&apos;t luck. It&apos;s the result of small decisions made consistently over a long period of time.
          </p>

          <p>
            Get that right, and the whole experience opens up. Get it wrong, and it becomes a very long day.
          </p>

          <EndCTA />
        </div>
      </article>

      <LegalFooter />
    </div>
  );
}
