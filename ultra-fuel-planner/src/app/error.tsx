"use client";

import { UFPMark } from "@/components/brand/UFPMark";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-paper text-ink flex items-center justify-center">
      <main className="max-w-lg px-6 text-center">
        <UFPMark className="w-20 h-12 mx-auto mb-8 opacity-60" />
        <h1 className="font-display text-4xl mb-4">Something&apos;s off.</h1>
        <p className="text-ink-2 mb-8">
          We&apos;ve logged the error. Try again in a moment, or head back to the{" "}
          <a href="/" className="text-ochre underline underline-offset-2">
            home page
          </a>
          .
        </p>
        <button
          onClick={reset}
          className="px-6 py-2 bg-ochre text-paper rounded hover:bg-ochre-hover transition-colors"
        >
          Try again
        </button>
      </main>
    </div>
  );
}
