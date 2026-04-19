import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { UFPMark } from "@/components/brand/UFPMark";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteNav plannerLabel="Open the planner" />
      <main className="mx-auto max-w-2xl px-6 pt-32 pb-24 text-center">
        <UFPMark className="w-24 h-16 mx-auto mb-8 opacity-60" />
        <h1 className="font-display text-5xl mb-4">Off the map.</h1>
        <p className="text-ink-2 text-lg mb-8">
          This page doesn&apos;t exist. Head back to the{" "}
          <Link href="/" className="text-ochre underline underline-offset-2">
            home page
          </Link>{" "}
          or open the{" "}
          <Link href="/planner" className="text-ochre underline underline-offset-2">
            planner
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
