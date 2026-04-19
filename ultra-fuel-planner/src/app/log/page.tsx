import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { LegalFooter } from "@/components/LegalFooter";

export const metadata: Metadata = {
  title: "The Log",
  description:
    "Race reports, fuelling lessons, and first-hand accounts from ultra running. Practical insights for trail and ultra runners preparing for their next event.",
  alternates: {
    canonical: "https://ultrafuelplanner.com/log",
  },
  openGraph: {
    title: "The Log | Ultra Fuel Planner",
    description:
      "Race reports, fuelling lessons, and first-hand accounts from ultra running. Practical insights for trail and ultra runners preparing for their next event.",
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

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "The Log",
  description:
    "Race reports, fuelling lessons, and first-hand accounts from ultra running. Practical insights for trail and ultra runners preparing for their next event.",
  url: "https://ultrafuelplanner.com/log",
  publisher: {
    "@type": "Organization",
    name: "Ultra Fuel Planner",
    url: "https://ultrafuelplanner.com",
  },
  blogPost: [
    {
      "@type": "BlogPosting",
      headline:
        "How I Fueled a 100km Ultra (and Why I Built Ultra Fuel Planner After)",
      url: "https://ultrafuelplanner.com/log/how-i-fueled-100km-ultra",
      datePublished: "2026-03-18",
      author: {
        "@type": "Person",
        name: "Ben",
        affiliation: {
          "@type": "Organization",
          name: "Trail Hustle",
          url: "https://trailhustle.com",
        },
      },
    },
  ],
};

export default function LogIndexPage() {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <SiteNav />

      {/* Header */}
      <div className="mx-auto w-full max-w-4xl px-6 pt-16 pb-10">
        <h1 className="text-4xl font-bold text-ink mb-3">The Log</h1>
        <p className="text-ink-3 text-lg leading-relaxed max-w-xl">
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
              className="group flex flex-col rounded-xl border border-rule bg-paper/50 p-6 hover:border-rule hover:bg-paper transition-all"
            >
              <div className="flex items-center gap-3 mb-4 text-xs text-ink-3">
                <span>{article.date}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {article.readTime}
                </span>
              </div>
              <h2 className="text-base font-semibold text-ink mb-3 leading-snug group-hover:text-ochre transition-colors">
                {article.title}
              </h2>
              <p className="text-sm text-ink-3 leading-relaxed flex-1">
                {article.excerpt}
              </p>
              <div className="mt-5 flex items-center gap-1 text-xs font-medium text-ochre group-hover:text-ochre transition-colors">
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
