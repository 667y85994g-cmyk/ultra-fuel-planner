import type { Metadata } from "next";
import Link from "next/link";
import { Mountain, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LegalFooter } from "@/components/LegalFooter";

export const metadata: Metadata = {
  title: "The Log",
  description:
    "Notes from the trail. Real-world fuelling, what works, what doesn't, and what's worth knowing when it matters.",
  alternates: {
    canonical: "https://ultrafuelplanner.com/log",
  },
  openGraph: {
    title: "The Log | Ultra Fuel Planner",
    description:
      "Notes from the trail. Real-world fuelling, what works, what doesn't, and what's worth knowing when it matters.",
    url: "https://ultrafuelplanner.com/log",
    type: "website",
  },
};

const articles = [
  {
    slug: "how-i-fueled-100km-ultra",
    title: "How I Fueled a 100km Ultra (and Why I Built Ultra Fuel Planner After)",
    excerpt:
      "A real-world look at fuelling, heat, mistakes, and what actually holds up over 100km.",
    readTime: "7 min read",
    date: "March 2026",
  },
];

export default function LogIndexPage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 w-full border-b border-stone-800/60 bg-stone-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <Mountain className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Ultra Fuel Planner</span>
          </Link>
          <Link href="/planner">
            <Button size="sm" className="gap-1.5">
              Build your plan
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="mx-auto w-full max-w-4xl px-6 pt-16 pb-10">
        <h1 className="text-4xl font-bold text-stone-50 mb-3">The Log</h1>
        <p className="text-stone-400 text-lg leading-relaxed max-w-xl">
          Notes from the trail. What works, what doesn&apos;t, and what&apos;s worth knowing when it matters.
        </p>
      </div>

      {/* Article grid */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/log/${article.slug}`}
              className="group flex flex-col rounded-xl border border-stone-800 bg-stone-900/50 p-6 hover:border-stone-700 hover:bg-stone-900 transition-all"
            >
              <div className="flex items-center gap-3 mb-4 text-xs text-stone-500">
                <span>{article.date}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {article.readTime}
                </span>
              </div>
              <h2 className="text-base font-semibold text-stone-100 mb-3 leading-snug group-hover:text-amber-400 transition-colors">
                {article.title}
              </h2>
              <p className="text-sm text-stone-400 leading-relaxed flex-1">
                {article.excerpt}
              </p>
              <div className="mt-5 flex items-center gap-1 text-xs font-medium text-amber-500 group-hover:text-amber-400 transition-colors">
                Read article
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
